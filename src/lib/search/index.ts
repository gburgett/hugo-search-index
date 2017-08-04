import { SearchIndexLoader } from './SearchIndexLoader'
import { SearchStore } from './store'

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

export function InitSearch(indexUrl: string, cb: (err, store?: SearchStore) => void) {
  downloadIndex(indexUrl, (downloadErr, data) => {
    if (downloadErr) { cb(downloadErr); return }
    // console.log('index downloaded, size: ' + (data.length / 1024).toFixed(1) + ' KB')

    const loader = new SearchIndexLoader(undefined, {
      keySeparator: '~',
    })
    loader.load(data, (loadErr, index) => {
      if (loadErr) { cb(loadErr); return }

      const store = new SearchStore(index)
      cb(null, store)
    })
  })
}

export default InitSearch
export { SearchStore, SearchResult } from './store'
export { SearchIndexLoader } from './SearchIndexLoader'
