/* tslint:disable:no-unused-expression max-line-length no-var-requires no-console */

import * as chai from 'chai'
import {Index} from 'search-index'
const expect = chai.expect

import SearchIndexLoader from './SearchIndexLoader'

const filename = '/base/src/search/test_search_index.gz'

describe('loadSearchIndex', () => {

  let currentsi: Index

  afterEach((done) => {
    if (currentsi) {
      currentsi.close((err) => {
        if (err) {
          console.log(err)
        }
        currentsi = undefined
        done(err)
      })
    }
  })

  it('should load without errors', (done) => {
    const loader = new SearchIndexLoader(undefined, {
        keySeparator: '~',
        indexPath: 'test.SearchIndexLoader.1',
      })

    downloadIndex(filename, (downloadErr, data) => {
      if (downloadErr) {
        done(downloadErr)
        return
      }

      loader.load(data, (loadErr, si) => {
        if (loadErr) {
          done(loadErr)
          return
        }
        currentsi = si

        expect(si).to.not.be.null

        si.countDocs((errCD, count) => {
          if (errCD) {
            done(errCD)
            return
          }
          expect(count).to.equal(49)
          done()
        })
      })
    })

  })

  it('should get a single doc', (done) => {
    const loader = new SearchIndexLoader(undefined, {
        keySeparator: '~',
        indexPath: 'test.SearchIndexLoader.2',
      })

    downloadIndex(filename, (downloadErr, data) => {
      if (downloadErr) {
        done(downloadErr)
        return
      }

      loader.load(data, (loadErr, si) => {
        if (loadErr) {
          done(loadErr)
          return
        }
        currentsi = si

        expect(si).to.not.be.null

        let numDocs = 0
        si.get(['about.md']).on('data', (doc) => {
          numDocs++

          expect(doc).to.not.be.null
          expect(doc.date).to.equal('2014-12-14T13:49:30-06:00')
          expect(doc.title).to.equal('about')
        }).on('end', () => {
          expect(numDocs).to.equal(1)
          done()
        })
      })
    })
  })

  it('should search by tags', (done) => {
    const loader = new SearchIndexLoader(undefined, {
        keySeparator: '~',
        indexPath: 'test.SearchIndexLoader.3',
      })

    downloadIndex(filename, (downloadErr, data) => {
      if (downloadErr) {
        done(downloadErr)
        return
      }

      loader.load(data, (loadErr, si) => {
        if (loadErr) {
          done(loadErr)
          return
        }
        currentsi = si
        expect(si).to.not.be.null

        const docs = []
        si.search({
          query: {
            AND: {
              tags: ['golang'],
            },
          },
        }).on('data', (doc) => {
          docs.push(doc)
        }).on('end', () => {
          expect(docs).to.have.length(1)
          expect(docs[0].id).to.equal('post/2015/01_which-which.md')

          done()
        })
      })
    })
  })

  it('should search by search string', (done) => {
    const loader = new SearchIndexLoader(undefined, {
        keySeparator: '~',
        indexPath: 'test.SearchIndexLoader.4',
      })

    downloadIndex(filename, (downloadErr, data) => {
      if (downloadErr) {
        done(downloadErr)
        return
      }

      loader.load(data, (err, si) => {
        if (err) {
          done(err)
        }
        currentsi = si
        expect(err).to.be.null
        expect(si).to.not.be.null

        const docs = []
        si.search('die zauberflöte').on('data', (doc) => {
          docs.push(doc)
        }).on('end', () => {
          expect(docs).to.have.length(1)
          expect(docs[0].id).to.equal('post/2015/01_euro-trip.md')

          si.close(done)
        })
      })
    })
  })

})

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
