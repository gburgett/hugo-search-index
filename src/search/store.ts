
import {Index, SearchResult} from 'search-index'

type SearchCallback = (error: Error, results?: SearchResult[]) => void

export class SearchStore {

  public currentQuery: string

  public queryHistory: string[]

  public results: SearchResult[]

  public lastError: string

  public inProgress: boolean

  private index: Index

  constructor(index: Index) {
    this.index = index
    this.queryHistory = []
    this.results = []
  }

  public runSearch(query: string, lang?: string | SearchCallback, cb?: SearchCallback): void {
    if (!cb && typeof lang === 'function') {
      cb = lang
      lang = undefined
    }

    if (this.currentQuery) {
      this.queryHistory.splice(0, 0, this.currentQuery)
    }

    this.inProgress = true
    this.currentQuery = query
    const results = []

    // search index only handles lower case - no matches on uppercase
    query = query.toLocaleLowerCase()

    const queryObj = {
      AND: {
        '*': query.split(' '),
      },
    }
    if (lang) {
      (queryObj.AND as any).lang = [ lang ]
    }

    this.index.search({ query: queryObj })
      .on('data', (doc) => {
        results.push(doc)
      })
      .on('end', () => {
        this.inProgress = false
        this.results = results.slice()
        cb(undefined, results)
      })
      .on('error', (error) => {
        this.results = undefined
        this.lastError = error
        cb(error)
      })
  }
}

export default SearchStore
