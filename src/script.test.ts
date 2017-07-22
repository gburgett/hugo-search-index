// tslint:disable:no-console no-unused-expression

import * as chai from 'chai'
import { SearchResult, SearchStore } from './search'
const expect = chai.expect

describe('script bundle', () => {

  let div: HTMLElement
  let script: HTMLScriptElement
  let store: SearchStore

  before((done) => {
    // create the html structure
    div = document.createElement('div')
    div.innerHTML =
`<form id="searchForm">
    <input type="search"></input>
    <button type="submit"></button>
</form>
<table id="searchResults">
</table>`
    document.body.appendChild(div)

    // load the script
    script = document.createElement('script')
    script.addEventListener('searchIndexError', (evt: CustomEvent) => {
      console.error('[ScriptTest] Error!', evt.detail)
    })
    script.addEventListener('searchIndexLoaded', (evt: CustomEvent) => {
      console.log('[ScriptTest] Store loaded')
      store = evt.detail
      done()
    })
    script.setAttribute('data-search-index', '/base/src/search/test_search_index.gz')
    script.src = '/base/src/script.ts'
    document.body.appendChild(script)
  })

  after(() => {
    document.body.removeChild(div)
    document.body.removeChild(script)
    div = null
    script = null
    store = null
    console.log('cleared test dom')
  })

  it('should load and ready the store for search', () => {

    // "act" in before

    // assert
    expect(store).to.not.be.null
  })

  function doSearch(query: string) {
    const input = document.querySelector('#searchForm input') as HTMLInputElement
    input.value = query
    const button = document.querySelector('#searchForm button') as HTMLButtonElement
    button.click()
  }

  function wireEvents(done, results, err) {
    window.addEventListener('searchIndexError', err)
    window.addEventListener('searchIndexResults', results)
    const mochaDone = done
    return (doneErr) => {
      window.removeEventListener('searchIndexError', err)
      window.removeEventListener('searchIndexResults', results)
      mochaDone(doneErr)
    }
  }

  it('should update the searchResults table on search', (done) => {
    // {"key":"TF~body~become","value":[[0.5217391304347826,"post/2016/01_exploring-and-networking.md"],[0.52,"post/2015/12_welcome_weekend.md"],[0.5131578947368421,"post/2015/11_remaining_humble.md"],[0.5125,"post/2016/10_momentum_europe.md"],[0.5087719298245614,"post/2017/07_home.md"],[0.5045045045045045,"post/2016/05_my_happy_place.md"],[0.503731343283582,"albania/2015.md"],[0.502770083102493,"albania/2017.md"],[0.5026178010471204,"albania/2014.md"],[0.5022222222222222,"albania/2016_IceAndSpice.md"]]}
    const results = (evt) => {
      const rows = document.querySelectorAll('#searchResults tr')

      expect(rows).to.have.length(10)
      const anchor = rows[0].querySelector('a')
      expect(anchor.text).to.equal('Exploring and Networking')
      expect(anchor.href).to.equal('http://localhost:9876/post/2016/01_exploring-and-networking')
      const date = rows[0].querySelector('.date')
      expect(date.innerHTML).to.equal(new Date('1/30/2016').toLocaleDateString())
      const body = rows[0].querySelector('.body')
      expect(body.innerHTML).contains('This past week I went to the')
      done()
    }
    const err = (evt) => {
      done(evt.detail)
    }

    done = wireEvents(done, results, err)

    // act
    doSearch('become')
  })

  it('should include search results in the event', (done) => {
    const results = (evt) => {
      const rows: SearchResult[] = evt.detail

      expect(rows).to.have.length(1)
      expect(rows[0].id).to.equal('post/2015/01_euro-trip.md')
      expect(rows[0].document.relativeurl).to.equal('/post/2015/01_euro-trip')
      expect(rows[0].document.date).to.equal('2015-01-05T10:20:47-06:00')
      expect(rows[0].document.title).to.equal('Euro Trip!')
      done()
    }
    const err = (evt) => {
      done(evt.detail)
    }

    done = wireEvents(done, results, err)

    // act
    doSearch('skopje')
  })
})
