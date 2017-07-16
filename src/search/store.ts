
export class SearchStore {

  public currentQuery: string

  public queryHistory: string[]

  public results: search_index.SearchResult[]

  public lastError: string

  public inProgress: boolean

  private index: search_index.Index

  constructor(index: search_index.Index) {
    this.index = index
    this.queryHistory = []
    this.results = []
  }

  public async runSearch(query: string, lang?: string): Promise<void> {
    if (this.currentQuery) {
      this.queryHistory.splice(0, 0, this.currentQuery)
    }

    this.inProgress = true
    this.currentQuery = query
    const results = []

    return new Promise<void>((resolve, reject) => {
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
          this.results = results
          resolve()
        })
        .on('error', (error) => {
          this.results = undefined
          this.lastError = error
          reject(error)
        })
    })
  }
}

export default SearchStore
