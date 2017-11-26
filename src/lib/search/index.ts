import * as Path from 'path'

import {Index, Options, SearchIndexLib} from 'search-index'
import { SearchIndexLoader } from './SearchIndexLoader'
import { SearchStore } from './store'

const searchIndexOptions = {
  keySeparator: '~',
}

type CB<T> = (err: string, result?: T) => void

function downloadIndexLocation(url: string, cb: CB<string>) {
  const oReq = new XMLHttpRequest()

  oReq.onload = (oEvent) => {
    const lines = oReq.responseText.split('\n')
    cb(null, lines[0])
  }

  oReq.onerror = (oError) => {
    cb(oError.message)
  }

  oReq.open('GET', url, true)
  oReq.send()
}

function downloadIndex(url: string, cb: CB<Uint8Array>) {
  const oReq = new XMLHttpRequest()

  oReq.onload = (oEvent) => {
    const arrayBuffer = oReq.response // Note: not oReq.responseText
    if (arrayBuffer) {
      const byteArray = new Uint8Array(arrayBuffer)
      cb(null, byteArray)
    } else {
      cb('No response buffer at ' + url)
    }
  }

  oReq.onerror = (oError) => {
    cb(oError.message)
  }

  oReq.responseType = 'arraybuffer'
  oReq.open('GET', url, true)
  oReq.send()
}

declare const SearchIndex: SearchIndexLib

export interface IInitSearchOptions {
  cacheExpiration?: number
}

export type InitSearchCallback = (err, store?: SearchStore) => void

export function InitSearch(indexUrl: string, optionsOrCb: IInitSearchOptions | InitSearchCallback, cb?: InitSearchCallback) {
  const options: IInitSearchOptions = {
    cacheExpiration: 24 * 60 * 60 * 1000,
  }
  if (cb) {
    for (const key in options) {
      if (options.hasOwnProperty(key) && optionsOrCb[key]) {
        options[key] = optionsOrCb[key]
      }
    }
  } else {
    cb = optionsOrCb as InitSearchCallback
  }

  downloadIndexLocation(indexUrl, (err1, location) => {
    if (err1) { cb(err1); return }

    const prevLocation = localStorage.getItem('hugo-search-index.location')
    const expiresAt = localStorage.getItem('hugo-search-index.expires')
    if (prevLocation && prevLocation === location) {
      if (expiresAt && expiresAt > Date.now().toString()) {
        // we're good
        SearchIndex(searchIndexOptions, (err2, index) => {
          cb(err2, new SearchStore(index))
        })
        return
      }
    }

    // need to rebuild the index
    indexUrl = Path.join(indexUrl, location)
    downloadIndex(indexUrl, (downloadErr, data) => {
      if (downloadErr) { cb(downloadErr); return }
      // console.log('index downloaded, size: ' + (data.length / 1024).toFixed(1) + ' KB')

      const loader = new SearchIndexLoader(undefined, searchIndexOptions)
      loader.load(data, (loadErr, index) => {
        if (loadErr) { cb(loadErr); return }

        localStorage.setItem('hugo-search-index.location', location)
        localStorage.setItem('hugo-search-index.expires', (Date.now() + options.cacheExpiration).toString())

        const store = new SearchStore(index)
        cb(null, store)
      })
    })
  })
}

export default InitSearch
export { SearchStore, SearchResult } from './store'
export { SearchIndexLoader } from './SearchIndexLoader'
