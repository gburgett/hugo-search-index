# Hugo Search Index

[![Build Status](https://travis-ci.org/gburgett/hugo-search-index.svg?branch=master)](https://travis-ci.org/gburgett/hugo-search-index)

[![npm version](https://badge.fury.io/js/hugo-search-index.svg)](https://badge.fury.io/js/hugo-search-index)
[![npm](https://img.shields.io/npm/dm/hugo-search-index.svg)](https://www.npmjs.com/package/hugo-search-index)
![license](https://img.shields.io/github/license/gburgett/hugo-search-index.svg)


This library contains gulp tasks and a prebuilt browser script that implements search for [Hugo static sites](https://gohugo.io).  Using this library along with the excellent [search-index by Fergie Mcdowall](https://github.com/fergiemcdowall/search-index) you can create a search page for your static site, without implementing any server-side processing!  Since all the searching happens in the browser, you can still host your site on Github Pages or Netlify.

There are two stages to getting your search up and running:
1) Using Gulp, generate your search index from your markdown content
2) Serve your generated search index from your web server, and include the search.js script on your search page.

### Step 1 - generate your search index using gulp

You'll need to install gulp first, along with this library:
```
$ npm install --save-dev gulp hugo-search-index
```

Now create a gulpfile, which is just a javascript file that is run by nodejs.  You'll import the gulp tasks from this library, and then run `build-search-index` as a child task.
```js
const gulp = require('gulp')

// import search index tasks
require('hugo-search-index/gulp')(gulp)

gulp.task('build', ['search'])
```

`build-search-index` will scan your `content` directory for all markdown files, and create a search index around them.  It will then gzip this search index and place the resulting file in the `public` directory, which is where the rest of your hugo site goes when it's built.

Now build the search index with gulp:
```
$ gulp build
```

### Step 2 - load your search index in a search page

Now you need to create a search page.  Fortunately this is pretty simple.  You just need to create a form element and a results table, and add the appropriate IDs to them.  `search.js` will find them automatically, and process searches for you, showing results.

An example form with bootstrap:
```html
<row>
  <form id="searchForm">
    <div class='form-group has-feedback'>
      <label for="search">Search</label>
      <div class='input-group'>
        <span class="input-group-addon"><i class='glyphicon glyphicon-search'></i></span>
        <input type="search" class='form-control' id='search' placeholder="Search..."></input>
        <i id="searchSpinner" class="fa fa-spinner fa-spin" aria-hidden="true"></i>
      </div>
    </div>
  </form>
</row>

<div class='row'>
  <table id="searchResults">

  </table>
</div>

<script src="/js/search-index.min.js" ></script>
<script src="/js/search.min.js" ></script>
```

see the examples directory for more info.

### Basic functionality

`search.min.js` will automatically download the `search_index.gz` file from the root of your server, unpack it in the browser, and run searches whenever the user types something in the search bar.  One thing to be careful of is if the `search_index.gz` file is very large.  Fortunately text compresses very well, and since we're building the search index from your markdown content it doesn't end up getting very big.  On my blog where I've been posting monthly since 2014, the search index is only about 600kb gzipped.

Once loaded, `search.min.js` automatically looks for the following elements:

* A form with id `searchForm`
* An input with `type="search"` inside the form
* A table with id `searchResults`
* An element with id `searchSpinner`

If those exist, `search.min.js` will automatically wire up event handlers to the `onsubmit` event of the form and will write out search results as
table rows to the `searchResults` table.  It does no styling - style the form and table as you like!

### Custom Events

`search.min.js` also fires three custom events on the script element itself, which bubble up to the window:

* `searchIndexLoaded` is fired when the `search_index.gz` file is downloaded from the server, unzipped, and
  loaded into the search-index.  Once fired, there is an object on the `window` named `window.Store`.  This can
  be used to programmatically initiate a search.
* `searchIndexError` is fired when an unhandled error occurs, either on loading the `search_index.gz` file or during a search.
  The error is also logged to console.error.
* `searchIndexResults` is fired when search results come back from the search form, after they have been written to the table.
  If you don't include a table with ID `searchResults`, you can listen to this event to render the search results yourself.

Example hooking up to the events:

```js
window.addEventListener('searchIndexError', (event) => {
  console.error('An error occured!' + event.detail)
})
window.addEventListener('searchIndexResults', (event) => {
  myCustomResultRenderer(event.detail)
})
```

```html
<script src="/js/search-index.min.js" ></script>
<script src="/js/search.min.js" onsearchIndexResults="myCustomResultRenderer" onsearchIndexError="myCustomErrorHandler" ></script>
```

### Configuration

You can add data attributes to the script tag in order to pass configuration options to `search.min.js`

```html
<script src="/js/search.min.js" 
  data-search-index="/assets/renamed_search_index.gz"
  data-language="{{ .Lang }}">  <!-- Get the current language from a Hugo template -->
```

The data attributes are:
* `data-search-index`: The URL where the search index should be downloaded, if not `/search_index.gz`
* `data-language`: The language of the current page.  You can have a search page for each language and only results with this language
    will be returned.


### Javascript Objects

#### Search Results

The object passed to the detail of the `searchIndexResults` event is an array of SearchResults objects.  These have the following typescript definition:

```ts
export declare class SearchResult {
    id: any
    score: number
    scoringCriteria: any
    document: {
      id: string,           // relative path of the markdown file ex. `post/first_post.md`
      lang: string,         // language of the markdown file for multilang sites ('en' if not specified)
      relativeurl: string,  // http url of the rendered file in the site, not including hostname i.e. `/post/first_post.md` 
      body: string,         // rendered markdown content stripped of HTML tags

      [key: string]: string // a dictionary of front matter data, the YAML TOML or JSON at the top of the markdown file.  Every key is lowercased.
    }
}
```

The `window.Store` object has the following typescript definition:

```ts
type SearchCallback = (error: Error, results?: SearchResult[]) => void

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

  /** Executes a search query, with an optional language specifier.  Calls the SearchCallback when finished, and updates the state. */
  public runSearch(query: string, lang?: string | SearchCallback, cb?: SearchCallback): void
}
```

You can call `window.Store.runSearch('my query', myResultsProcessor)` to run your own behind-the-scenes search that won't show up in the 
`searchResults` table. If you don't create a form for the script to attach to, you should use this to run your own searches and render
your own results.