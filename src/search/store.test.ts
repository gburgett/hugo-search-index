/* tslint:disable:no-unused-expression max-line-length no-var-requires no-console */

import * as chai from 'chai'
import * as fs from 'fs'
import * as memdown from 'memdown'
const expect = chai.expect

import * as levelup from 'levelup'

import SearchIndexLoader from './SearchIndexLoader'
import SearchStore from './store'

describe('SearchStore', () => {

  let levelDb: levelup.LevelUp
  let index: search_index.Index

  before((done) => {
    const db = levelup('si', {
      db: memdown,
      valueEncoding: 'json',
    })

    db.open((err) => {
      if (err) {
        done(err)
        return
      }
      levelDb = db

      buildIndex(db).then(
        (idx) => {
          index = idx
          done()
        },
        (err2) => {
          console.log('error loading search index: ', err2)
          done(err2)
        },
      )
    })
  })

  it('should init with empty results', () => {

    const store = new SearchStore(index)

    //  assert

    expect(store.results).to.have.length(0)
  })

  it('should put query in currentQuery param', async () => {

    const store = new SearchStore(index)

    //  act
    await store.runSearch('asdf;lkjqwer')

    //  assert
    expect(store.currentQuery).to.equal('asdf;lkjqwer')
  })

  it('should return empty results set with non-matching query', async () => {

    const store = new SearchStore(index)

    //  act
    await store.runSearch('asdf;lkjqwer')

    //  assert
    expect(store.results.slice()).to.be.empty
  })

  it('should return matching results for matching query', async () => {

    const store = new SearchStore(index)

    //  act
    await store.runSearch('FTP')

    //  assert
    const results = store.results.slice()
    expect(results).to.have.length(1, 'length')
    expect(results[0].id).to.equal('post/2017/04_modern_static_sites.md')
    expect(results[0].score).to.be.greaterThan(0.47)
    expect(results[0].document).to.not.be.empty
    const doc = results[0].document
    if (doc) {
      expect(doc.aliases).to.deep.equal(['/post/modern_static_sites/'])
      expect(doc.body).to.not.be.empty
    }
  })

  it.skip('should return results only matching given language', async () => {

    const store = new SearchStore(index)

    //  act
    await store.runSearch('ligjet', 'en')

    //  assert
    const results = store.results.slice()
    expect(results).to.have.length(1, 'length')
    expect(results[0].id).to.equal('projects/4-spiritual-laws.md')
    expect(results[0].score).to.be.greaterThan(0.45)
    expect(results[0].document).to.not.be.empty
    const doc = results[0].document
    if (doc) {
      expect(doc.name).to.equal('4 Spiritual Laws webpage')
      expect(doc.lang).to.equal('en')
      expect(doc.body).to.contain('This was a project completed')
    }
  })

  it.skip('should return results only matching second language', async () => {

    const store = new SearchStore(index)

    //  act
    await store.runSearch('4 ligjet', 'sq')

    //  assert
    const results = store.results.slice()
    expect(results).to.have.length(1, 'length')
    expect(results[0].id).to.equal('projects/4-spiritual-laws.sq.md')
    expect(results[0].score).to.be.greaterThan(0.45)
    expect(results[0].document).to.not.be.empty
    const doc = results[0].document
    if (doc) {
      expect(doc.name).to.equal('Webfaqja 4 Ligjet Shpirterorë')
      expect(doc.lang).to.equal('sq')
      expect(doc.body).to.contain('Ky projekt tregon të katër ligjet')
    }
  })

  it('should put previous search in history', async () => {

    const store = new SearchStore(index)

    //  act
    await store.runSearch('asdf;lkjqwer')
    await store.runSearch('qwertyuiop')
    await store.runSearch('FTP account')
    await store.runSearch('mnbvvccx')

    //  assert
    expect(store.queryHistory.slice()).to.deep.equal([
      'FTP account',
      'qwertyuiop',
      'asdf;lkjqwer',
    ])
  })
})

function buildIndex(db: levelup.LevelUp): Promise<search_index.Index> {

  const loader = new SearchIndexLoader(require('search-index'), {
    indexes: db,
  })
  const gzippedContents = fs.readFileSync(__dirname + '/test_search_index.gz')

  return new Promise((resolve, reject) => {
    loader.load(gzippedContents, (err2, si) => {
      if (err2) {
        reject(err2)
        return
      }
      resolve(si)
    })
  })
}
