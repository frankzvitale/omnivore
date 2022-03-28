import React from 'react'
import {
  Desktop,
  DeviceTabletSpeaker,
  DeviceMobileCamera,
} from 'phosphor-react'
import { Box, HStack } from '../elements/LayoutPrimitives'
import { StyledText, StyledImg, StyledAnchor } from '../elements/StyledText'
import { TooltipWrapped } from './Tooltip'
import Link from 'next/link'
import { InstallationIcon } from './images/InstallationIcon'

const TooltipStyle = {
  backgroundColor: '#F9D354',
  color: '#0A0806',
}

export default function MobileInstallHelp(): JSX.Element {
  const [selectedTooltip, setSelectedTooltip] =
    React.useState<string>('Available for Mac')
  const platformSizes = [
    {
      label: 'Available for Mac',
      icon: <Desktop color="#F9D354" />,
    },
    {
      label: 'Available for Tablet',
      icon: <DeviceTabletSpeaker color="#F9D354" />,
    },
    {
      label: 'Available for Phone',
      icon: <DeviceMobileCamera color="#F9D354" />,
    },
  ]
  return (
    <Box
      css={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gridTemplateRows: '.5fr .5fr .5fr',
        backgroundColor: '$grayBg',
        padding: '15px',
        '@lg': {
          marginTop: '0',
          paddingTop: '0',
          gridTemplateColumns: '1fr 2fr 1fr',
          gridTemplateRows: '1fr',
          height: '9rem',
        },
      }}
    >
      <Box
        css={{
          gridColumn: 1 / 2,
          gridRow: 1 / 2,
          marginRight: '$3',
          minWidth: '170px',
          maxWidth: '200px',
          alignSelf: 'center',
          '@lg': {
            minWidth: '200px',
            gridColumn: '1',
            gridRow: '1',
          },
          backgroundColor: '$grayBase',
          display: 'flex',
          position: 'relative',
          height: '116px',
        }}
      >
        <Box
          css={{
            position: 'absolute',
            top: '-15px',
            height: '130px',
          }}
        >
          <InstallationIcon />
        </Box>
      </Box>
      <Box
        css={{
          gridColumn: '2',
          gridRow: '1',
          display: 'flex',
          flexDirection: 'column',
          '@lg': {
            marginTop: '$4',
          },
        }}
      >
        <Link passHref href="/help/saving-links">
          <StyledAnchor
            css={{
              fontWeight: '600',
              fontSize: '12px',
              lineHeight: '18px',
              textAlign: 'right',
              color: '$grayTextContrast',
              '@lg': {
                display: 'none',
              },
            }}
          >
            Learn more
          </StyledAnchor>
        </Link>
        <StyledText
          as={'h3'}
          css={{
            fontSize: '18px',
            fontWeight: 700,
            marginTop: 0,
            marginBottom: 0,
            color: '$grayTextContrast',
            lineHeight: '22.5px',
            '@lg': {
              fontSize: '16px',
              lineHeight: '20px',
            },
          }}
        >
          Install Omnivore for iOS
        </StyledText>
      </Box>
      <StyledText
        css={{
          size: '14px',
          my: '$2',
          fontWeight: 400,
          color: '$grayTextContrast',
          maxWidth: '20rem',
          lineHeight: '21px',
          gridColumn: '1 / span 3',
          gridRow: '2 / 3',
          alignSelf: 'center',
          '@lg': {
            gridColumn: '2',
            gridRow: '1',
            alignSelf: 'center',
            marginTop: '$4',
          },
        }}
      >
        With the Omnivore iOS app installed you can save any link using our
        share extension.
        <br />
        <Link passHref href="/help/saving-links">
          <StyledAnchor
            css={{
              color: '$grayTextContrast',
              fontSize: '14px',
              fontWeight: 600,
              display: 'none',
              '@lg': {
                display: 'initial',
                textDecoration: 'underline',
              },
            }}
          >
            Learn more about the share extension here.
          </StyledAnchor>
        </Link>
      </StyledText>
      <HStack
        css={{
          gridRow: '3',
          display: 'flex',
          alignItems: 'center',
          gridColumn: '1 / span 2',
          justifyContent: 'space-between',
          '@lg': {
            flexDirection: 'row-reverse',
            gridColumn: '3',
            gridRow: '1',
          },
        }}
      >
        <StyledImg
          css={{
            width: '45%',
            maxWidth: '150px',
            '@lg': {
              marginLeft: '$3',
              width: '50%',
            },
          }}
          src="/static/media/appStoreBadge.png"
          alt="Save articles"
        />
        <HStack
          css={{
            width: '40%',
            justifyContent: 'space-between',
            maxWidth: '13rem',
            '@lg': {
              width: '100%',
            },
          }}
        >
          {platformSizes.map((item, idx) => (
            <TooltipWrapped
              key={`platformSize-${idx}`}
              tooltipContent={item.label}
              tooltipSide={'top'}
              style={TooltipStyle}
              arrowStyles={{ fill: '#F9D354' }}
            >
              <Box
                css={{
                  ml: '$1',
                }}
              >
                <Link href="/install/apple" passHref>
                  <StyledAnchor
                    onClick={() => setSelectedTooltip(item.label)}
                    css={{
                      mx: 'auto',
                      borderRadius: '50%',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 35,
                      width: 35,
                      cursor: 'pointer',
                      backgroundColor: '#F5F5F4',
                      ...(selectedTooltip !== item.label && {
                        filter: 'grayscale(1)',
                      }),
                      '&:focus': {
                        filter: 'grayscale(0)',
                      },
                      '&:active': {
                        filter: 'grayscale(0)',
                      },
                      '@lg': {
                        backgroundColor: '$tooltipIcons',
                        transition: 'filter .3s linear',
                        '&:hover': {
                          filter: 'grayscale(0)',
                        },
                      },
                    }}
                  >
                    {item.icon}
                  </StyledAnchor>
                </Link>
              </Box>
            </TooltipWrapped>
          ))}
        </HStack>
      </HStack>
    </Box>
  )
}
