// tslint:disable:prefer-for-of no-console

import { InitSearch, SearchResult, SearchStore } from './search'

// tslint:disable-next-line:interface-over-type-literal
declare type Window = {
  CustomEvent?: Event,
  Search: SearchStore,
  language: string,
}

((w: Window, d: Document) => {
  let me: Element | Document
  let url: string
  let lang: string

    // try using document.currentScript on modern browsers
  if (document.currentScript) {
    me = document.currentScript
    url = me.getAttribute('data-search-index')
    lang = me.getAttribute('data-language')
  } else {
      // look for the first script element with the data-search-index
    const script = document.querySelector('script[data-search-index]')
    if (script) {
      me = script
      url = me.getAttribute('data-search-index')
      lang = me.getAttribute('data-language')
    }
  }

  if (!me) {
    // fallback to window
    me = d
    lang = w.language
  }
  if (!url || url === '') {
    // fallback to default search index location
    url = '/search_index.gz'
  }

  function fireEvent(name: string, detail: any): void {
    let event
    if (w.CustomEvent) {
      event = new CustomEvent(name, {bubbles: true, cancelable: true, detail: detail})
    } else {
      event = document.createEvent('CustomEvent')
      event.initCustomEvent(name, true, true, detail)
    }

    me.dispatchEvent(event)
  }

  function fireError(error: string | Error): void {
    console.error('[SearchIndex] ' + error)
    fireEvent('searchIndexError', error)
  }

  function getSearchInput(searchForm: HTMLFormElement): HTMLInputElement {
    const inputs = searchForm.getElementsByTagName('input')
    for (let i = 0; i < inputs.length; ++i) {
      if (inputs[i].type === 'search') {
        return inputs[i]
      }
    }
      // no 'search' inputs, find a text input
    for (let i = 0; i < inputs.length; ++i) {
      if (inputs[i].type === 'text') {
        return inputs[i]
      }
    }

    return inputs.length > 0 ? inputs[0] : undefined
  }

  function writeSearchResults(table: HTMLTableElement, results: SearchResult[]): void {
    let body: HTMLTableSectionElement
    if (table.tBodies && table.tBodies.length > 0) {
      body = table.tBodies[0]
    } else {
      body = table.createTBody()
    }

    function resultToRow(r: SearchResult, row: HTMLTableRowElement): void {
      const date = r.document.date ? new Date(r.document.date).toLocaleDateString() : undefined
      let docBody: string = r.document.body
      if (docBody) {
        docBody = docBody.substring(0, 150) + '...'
      }
      row.innerHTML =
`<td>
  <h3><a href=${r.document.relativeurl}>${r.document.title || r.document.name}</a></h3>
  <span class="date">${date}</span>
  <div class="body">
      ${docBody}
  </div>
</td>`
    }

    let i = 0
    for (; i < body.rows.length; i++) {
      // overwrite existing rows
      resultToRow(results[i], body.rows[i])
    }

    for (; i < results.length; i++) {
      // append new rows as necessary
      resultToRow(results[i], body.insertRow())
    }

    for (; i < body.rows.length; i++) {
      // delete old rows
      body.deleteRow(i)
    }
  }

  console.log('initializing search with index ', url, 'lang', lang)
  InitSearch(url, (err, store) => {
    if (err) {
      fireError('Error loading search index: ' + err)
      return
    }
    w.Search = store
    fireEvent('searchIndexLoaded', { search: store })

    const searchForm = document.getElementById('searchForm')
    const output = document.getElementById('searchResults')
    if (searchForm && searchForm instanceof HTMLFormElement) {
      searchForm.onsubmit = (evt) => {
        evt.preventDefault()
        const input = getSearchInput(searchForm)
        if (!input) {
          fireError('Unable to find <input type="search"> inside <form id="searchForm">')
          return
        }

        const text = input.value
        w.Search.runSearch(text, lang, (error, results) => {
          if (error) {
            fireError(error)
            return
          }

          if (output && output instanceof HTMLTableElement) {
            writeSearchResults(output, results)
          }
          fireEvent('searchIndexResults', { results: results })
        })
      }
    }
  })

})(window as any, document)
