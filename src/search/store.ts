
import {Index, SearchResult as InternalSearchResult } from 'search-index'

type SearchCallback = (error: Error, results?: SearchResult[]) => void

// disable 'interface-name' because we want to override the "SearchResult" definition from 'search-index' to extend the document definition.
// tslint:disable-next-line:interface-name
export interface SearchResult extends InternalSearchResult {
    /** The document itself - prepared by the gulp task from the markdown data */
    document: {
      /** relative path of the markdown file ex. `post/first_post.md`  */
      id: string,
      /** language of the markdown file for multilang sites ('en' if not specified) */
      lang: string,
      /** http url of the rendered file in the site, not including hostname i.e. `/post/first_post.md` */
      relativeurl: string,
      /** rendered markdown content stripped of HTML tags */
      body: string,

      /** a dictionary of front matter data, the YAML TOML or JSON at the top of the markdown file.
       * Every key is lowercased even if it was upper case in the front matter.
       */
      [key: string]: string,
    }
}

export class SearchStore {

  /** The search string which was most recently executed by runSearch */
  public currentQuery: string

  /** An array of previous search strings */
  public queryHistory: string[]

  /** The current search results, undefined if the current search errored. */
  public results: SearchResult[]

  /** The most recent error, undefined if the current search came back with success. */
  public lastError: string

  /** True if there is a search in progress */
  public inProgress: boolean

  private index: Index

  constructor(index: Index) {
    this.index = index
    this.queryHistory = []
    this.results = []
  }

  /** Executes a search query, with an optional language specifier.  Calls the SearchCallback when finished, and updates the state. */
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
    const results: SearchResult[] = []

      // remove whitespace
    query = query.trim()
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
