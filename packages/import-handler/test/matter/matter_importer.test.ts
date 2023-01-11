import 'mocha'
import * as chai from 'chai'
import { expect } from 'chai'
import chaiString from 'chai-string'
import * as fs from 'fs'
import {
  importMatterArchive,
  importMatterHistoryCsv,
} from '../../src/matterHistory'
import { stubImportCtx } from '../util'
import { ImportContext } from '../../src'
import { Readability } from '@omnivore/readability'

chai.use(chaiString)

describe('Load a simple _matter_history file', () => {
  it('should find the URL of each row', async () => {
    const urls: URL[] = []
    const stream = fs.createReadStream('./test/matter/data/_matter_history.csv')
    const stub = stubImportCtx()
    stub.urlHandler = (ctx: ImportContext, url): Promise<void> => {
      urls.push(url)
      return Promise.resolve()
    }

    await importMatterHistoryCsv(stub, stream)
    expect(stub.countFailed).to.equal(0)
    expect(stub.countImported).to.equal(1)
    expect(urls).to.eql([
      new URL('https://www.bloomberg.com/features/2022-the-crypto-story/'),
    ])
  })
})

describe('Load archive file', () => {
  it('should find the URL of each row', async () => {
    const urls: URL[] = []
    const stream = fs.createReadStream('./test/matter/data/Archive.zip')
    const stub = stubImportCtx()
    stub.contentHandler = (
      ctx: ImportContext,
      url: URL,
      title: string,
      originalContent: string,
      parseResult: Readability.ParseResult
    ): Promise<void> => {
      urls.push(url)
      return Promise.resolve()
    }

    await importMatterArchive(stream, stub)
    expect(stub.countFailed).to.equal(0)
    expect(stub.countImported).to.equal(1)
    expect(urls).to.eql([
      new URL('https://www.bloomberg.com/features/2022-the-crypto-story/'),
    ])
  })
})
