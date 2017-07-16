/* tslint:disable:no-unused-expression max-line-length no-var-requires no-console */

import * as chai from 'chai'
import * as fs from 'fs-extra'
import * as levelup from 'levelup'
import * as memdown from 'memdown'
import * as path from 'path'
const expect = chai.expect

import SearchIndexLoader from './SearchIndexLoader'

const filename = __dirname + '/test_search_index.gz'

describe('loadSearchIndex', () => {

  let levelDb: levelup.LevelUp
  let currentsi: search_index.Index

  beforeEach((done) => {
    const db = levelup('si', {
      db: memdown,
      valueEncoding: 'json',
    })

    db.open((err) => {
      if (err) {
        done(err)
        return
      }
      console.log('levelup instance opened')
      levelDb = db
      done()
    })
  })

  afterEach((done) => {
    if (currentsi) {
      currentsi.close((err) => {
        if (err) {
          console.log(err)
        }
        currentsi = undefined
        levelDb = undefined
        console.log('levelup instance closed')
        done(err)
      })
    }
  })

  it('should load without errors', (done) => {
    const loader = new SearchIndexLoader(require('search-index'), {
      // indexes: levelDb,
    })

    fs.readFile(filename, (readErr, buff) => {
      if (readErr) { done(readErr); return }
      loader.load(buff, (loadErr, si) => {
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
          expect(count).to.equal(48)
          done()
        })
      })
    })

  })

  it('should get a single doc', (done) => {
    const loader = new SearchIndexLoader(require('search-index'), {
        indexes: levelDb,
      })

    fs.readFile(filename, (readErr, buff) => {
      if (readErr) { done(readErr); return }
      loader.load(buff, (loadErr, si) => {
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
          console.log('doc:', JSON.stringify(doc))
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
    const loader = new SearchIndexLoader(require('search-index'), {
        indexes: levelDb,
      })

    fs.readFile(filename, (readErr, buff) => {
      if (readErr) { done(readErr); return }
      loader.load(buff, (loadErr, si) => {
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
    const loader = new SearchIndexLoader(require('search-index'), {
        indexes: levelDb,
      })

    loader.load(fs.readFileSync(filename), (err, si) => {
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
