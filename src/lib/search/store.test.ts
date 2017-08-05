/* tslint:disable:no-unused-expression max-line-length no-var-requires no-console */

import * as chai from 'chai'
const expect = chai.expect

import {Index, Options} from 'search-index'
import SearchIndexLoader from './SearchIndexLoader'
import SearchStore from './store'

describe('SearchStore', () => {

  let index: Index

  before((done) => {
    buildIndex((err, idx) => {
      if (err) {
        console.log('error loading search index: ', err)
        done(err)
        return
      }

      index = idx
      done()
    })
  })

  it('should init with empty results', () => {

    const store = new SearchStore(index)

    //  assert

    expect(store.results).to.have.length(0)
  })

  it('should put query in currentQuery param', (done) => {

    const store = new SearchStore(index)

    //  act
    store.runSearch('asdf;lkjqwer', (err, results) => {
      if (err) { done(err); return }

      //  assert
      expect(store.currentQuery).to.equal('asdf;lkjqwer')

      done()
    })
  })

  it('should return empty results set with non-matching query', (done) => {

    const store = new SearchStore(index)

    //  act
    store.runSearch('asdf;lkjqwer', (err, results) => {
      if (err) { done(err); return }

      //  assert
      expect(results.slice()).to.be.empty
      expect(store.results.slice()).to.be.empty

      done()
    })
  })

  it('should return matching results for matching query', (done) => {

    const store = new SearchStore(index)

    //  act
    store.runSearch('FTP', (err, results) => {

      if (err) { done(err); return }

      //  assert
      results = results.slice()
      expect(results).to.have.length(1, 'length')
      expect(results[0].id).to.equal('post/2017/04_modern_static_sites.md')
      expect(results[0].score).to.be.greaterThan(0.47)
      expect(results[0].document).to.not.be.empty
      const doc = results[0].document
      if (doc) {
        expect(doc.aliases).to.deep.equal(['/post/modern_static_sites/'])
        expect(doc.body).to.not.be.empty
      }

      expect(results).to.deep.equal(store.results, 'results === store.results')

      done()
    })
  })

  it('should trim whitespace from query', (done) => {

    const store = new SearchStore(index)

    //  act
    store.runSearch('FTP ', (err, results) => {

      if (err) { done(err); return }

      //  assert
      results = results.slice()
      expect(results).to.have.length(1, 'length')
      expect(results[0].id).to.equal('post/2017/04_modern_static_sites.md')

      done()
    })
  })

  it.skip('should return results only matching given language', (done) => {

    const store = new SearchStore(index)

    //  act
    store.runSearch('ligjet', 'en', (err, results) => {
      if (err) { done(err); return }

      //  assert
      results = results.slice()
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

      expect(results).to.deep.equal(store.results, 'results === store.results')

      done()
    })
  })

  it.skip('should return results only matching second language', (done) => {

    const store = new SearchStore(index)

    //  act
    store.runSearch('4 ligjet', 'sq', (err, results) => {
      if (err) { done(err); return }

      //  assert
      results = results.slice()
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

      done()
    })
  })

  it('should put previous search in history', (done) => {

    const store = new SearchStore(index)

    //  act
    store.runSearch('asdf;lkjqwer', (err1) => {
      if (err1) { done(err1); return }

      store.runSearch('qwertyuiop', (err2) => {
        if (err2) { done(err2); return }

        store.runSearch('FTP account', (err3) => {
          if (err3) { done(err3); return }

          store.runSearch('mnbvvccx', (err4) => {
            if (err4) { done(err4); return }

              //  assert
            expect(store.queryHistory.slice()).to.deep.equal([
              'FTP account',
              'qwertyuiop',
              'asdf;lkjqwer',
            ])

            done()
          })
        })
      })
    })

  })
})

function buildIndex(cb: (err, idx?: Index) => void) {

  const loader = new SearchIndexLoader(undefined, {
      keySeparator: '~',
      indexPath: 'test.store.' + Math.random(),
    })

  downloadIndex('/base/src/lib/search/test_search_index.gz', (downloadErr, gzippedContents) => {
    if (downloadErr) {
      cb(downloadErr)
      return
    }
    loader.load(gzippedContents, (loadErr, si) => {
      if (loadErr) {
        cb(loadErr)
        return
      }
      cb(null, si)
    })
  })
}

function downloadIndex(url: string, cb: (err, index?: Uint8Array) => void) {
  const oReq = new XMLHttpRequest()

  oReq.onload = (oEvent) => {
    const arrayBuffer = oReq.response // Note: not oReq.responseText
    if (arrayBuffer) {
      const byteArray = new Uint8Array(arrayBuffer)
      cb(null, byteArray)
    }
  }

  oReq.onerror = (oError) => {
    cb(oError)
  }

  oReq.responseType = 'arraybuffer'
  oReq.open('GET', url, true)
  oReq.send()
}
