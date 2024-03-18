import { Client } from '@notionhq/client'
import axios from 'axios'
import { updateIntegration } from '.'
import { Integration } from '../../entity/integration'
import { LibraryItem } from '../../entity/library_item'
import { env } from '../../env'
import { Merge } from '../../util'
import { logger } from '../../utils/logger'
import { getHighlightUrl } from '../highlights'
import { IntegrationClient } from './integration'

type AnnotationColor =
  | 'default'
  | 'gray'
  | 'brown'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'red'
  | 'gray_background'
  | 'brown_background'
  | 'orange_background'
  | 'yellow_background'
  | 'green_background'
  | 'blue_background'
  | 'purple_background'
  | 'pink_background'
  | 'red_background'

interface NotionPage {
  parent: {
    database_id: string
  }
  cover?: {
    external: {
      url: string
    }
  }
  icon?: {
    external: {
      url: string
    }
  }
  properties: {
    Title: {
      title: [
        {
          text: {
            content: string
          }
        }
      ]
    }
    Author: {
      rich_text: Array<{
        text: {
          content: string
        }
      }>
    }
    'Original URL': {
      url: string
    }
    'Omnivore URL': {
      url: string
    }
    'Saved At': {
      date: {
        start: string
      }
    }
    'Last Updated': {
      date: {
        start: string
      }
    }
    Tags?: {
      multi_select: Array<{ name: string }>
    }
  }
  children?: Array<{
    paragraph: {
      rich_text: Array<{
        text: {
          content: string
          link?: { url: string }
        }
        annotations: {
          code: boolean
          color: AnnotationColor
        }
      }>
      children?: Array<{
        paragraph: {
          rich_text: Array<{
            text: {
              content: string
            }
          }>
        }
      }>
    }
  }>
}

type Property = 'highlights'

interface Settings {
  parentPageId: string
  parentDatabaseId: string
  properties: Property[]
}

export class NotionClient implements IntegrationClient {
  name = 'NOTION'
  token: string

  private headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'Notion-Version': '2022-06-28',
  }
  private timeout = 5000 // 5 seconds
  private axiosInstance = axios.create({
    baseURL: 'https://api.notion.com/v1',
    timeout: this.timeout,
  })

  private client: Client
  private integrationData?: Merge<Integration, { settings?: Settings }>

  constructor(token: string, integration?: Integration) {
    this.token = token
    this.client = new Client({
      auth: token,
      timeoutMs: this.timeout,
    })
    this.integrationData = integration
  }

  accessToken = async (): Promise<string | null> => {
    try {
      // encode in base 64
      const encoded = Buffer.from(
        `${env.notion.clientId}:${env.notion.clientSecret}`
      ).toString('base64')

      const response = await this.axiosInstance.post<{ access_token: string }>(
        '/oauth/token',
        {
          grant_type: 'authorization_code',
          code: this.token,
          redirect_uri: `${env.client.url}/settings/integrations`,
        },
        {
          headers: {
            ...this.headers,
            Authorization: `Basic ${encoded}`,
          },
        }
      )
      return response.data.access_token
    } catch (error) {
      if (axios.isAxiosError(error)) {
        logger.error(error.response)
      } else {
        logger.error(error)
      }
      return null
    }
  }

  async auth(): Promise<string> {
    return Promise.resolve(env.notion.authUrl)
  }

  private itemToNotionPage = (
    item: LibraryItem,
    settings: Settings,
    lastSync?: Date | null
  ): NotionPage => {
    return {
      parent: {
        database_id: settings.parentDatabaseId,
      },
      icon: item.siteIcon
        ? {
            external: {
              url: item.siteIcon,
            },
          }
        : undefined,
      cover: item.thumbnail
        ? {
            external: {
              url: item.thumbnail,
            },
          }
        : undefined,
      properties: {
        Title: {
          title: [
            {
              text: {
                content: item.title,
              },
            },
          ],
        },
        Author: {
          rich_text: [
            {
              text: {
                content: item.author || 'unknown',
              },
            },
          ],
        },
        'Original URL': {
          url: item.originalUrl,
        },
        'Omnivore URL': {
          url: `${env.client.url}/me/${item.slug}`,
        },
        'Saved At': {
          date: {
            start: item.createdAt.toISOString(),
          },
        },
        'Last Updated': {
          date: {
            start: item.updatedAt.toISOString(),
          },
        },
        Tags: item.labels
          ? {
              multi_select: item.labels.map((label) => ({
                name: label.name,
              })),
            }
          : undefined,
      },
      children:
        settings.properties.includes('highlights') && item.highlights
          ? item.highlights
              .filter(
                (highlight) => !lastSync || highlight.updatedAt > lastSync // only new highlights
              )
              .map((highlight) => ({
                paragraph: {
                  rich_text: [
                    {
                      text: {
                        content: highlight.quote || '',
                        link: {
                          url: highlightUrl(item.slug, highlight.id),
                        },
                      },
                      annotations: {
                        code: true,
                        color: highlight.color as AnnotationColor,
                      },
                    },
                  ],
                  children: highlight.annotation
                    ? [
                        {
                          paragraph: {
                            rich_text: [
                              {
                                text: {
                                  content: highlight.annotation || '',
                                },
                              },
                            ],
                          },
                        },
                      ]
                    : undefined,
                },
              }))
          : undefined,
    }
  }

  private createPage = async (page: NotionPage) => {
    await this.client.pages.create(page)
  }

  private findPage = async (url: string, databaseId: string) => {
    const response = await this.client.databases.query({
      database_id: databaseId,
      page_size: 1,
      filter: {
        property: 'Omnivore URL',
        url: {
          equals: url,
        },
      },
    })
    if (response.results.length > 0) {
      return response.results[0]
    }

    return null
  }

  export = async (items: LibraryItem[]): Promise<boolean> => {
    const settings = this.integrationData?.settings
    if (!this.integrationData || !settings) {
      logger.error('Notion integration data not found')
      return false
    }

    const pageId = settings.parentPageId
    if (!pageId) {
      logger.error('Notion parent page id not found')
      return false
    }

    let databaseId = settings.parentDatabaseId
    if (!databaseId) {
      // create a database for the items
      const database = await this.client.databases.create({
        parent: {
          page_id: pageId,
        },
        title: [
          {
            text: {
              content: 'Library',
            },
          },
        ],
        description: [
          {
            text: {
              content: 'Library of saved items from Omnivore',
            },
          },
        ],
        properties: {
          Title: {
            title: {},
          },
          Author: {
            rich_text: {},
          },
          'Original URL': {
            url: {},
          },
          'Omnivore URL': {
            url: {},
          },
          'Saved At': {
            date: {},
          },
          'Last Updated': {
            date: {},
          },
          Tags: {
            multi_select: {},
          },
        },
      })

      // save the database id
      databaseId = database.id
      settings.parentDatabaseId = databaseId
      await updateIntegration(
        this.integrationData.id,
        {
          settings,
        },
        this.integrationData.user.id
      )
    }

    await Promise.all(
      items.map(async (item) => {
        const notionPage = this.itemToNotionPage(
          item,
          settings,
          this.integrationData?.syncedAt
        )
        const url = notionPage.properties['Omnivore URL'].url

        const existingPage = await this.findPage(url, databaseId)
        if (existingPage) {
          // update the page
          await this.client.pages.update({
            page_id: existingPage.id,
            properties: notionPage.properties,
          })

          // append the children incrementally
          if (notionPage.children && notionPage.children.length > 0) {
            await this.client.blocks.children.append({
              block_id: existingPage.id,
              children: notionPage.children,
            })
          }

          return
        }

        // create the page
        return this.createPage(notionPage)
      })
    )

    return true
  }
}
