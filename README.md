# Hugo Search Index

[![Build Status](https://travis-ci.org/gburgett/hugo-search-index.svg?branch=master)](https://travis-ci.org/gburgett/hugo-search-index)

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

gulp.task('build', ['build-search-index'])
```

`build-search-index` will scan your `content` directory for all markdown files, and create a search index around them.  It will then gzip this search index and place the resulting file in the `public` directory, which is where the rest of your hugo site goes when it's built.

Now build the search index with gulp:
```
$ gulp build
```

### Step 2 - load your search index in a search page

Now you need to create a search page.  Fortunately this is pretty simple.  You just need to create a form element and a results table, and add the appropriate IDs to them.  `search.js` will find them automatically, and process searches for you, showing results.

`search.js` will automatically download the `search_index.gz` file from the root of your server, unpack it in the browser, and run searches whenever the user types something in the search bar.  One thing to be careful of is if the `search_index.gz` file is very large.  Fortunately text compresses very well, and since we're building the search index from your markdown content it doesn't end up getting very big.  On my blog where I've been posting monthly since 2014, the search index is only about 600kb gzipped.

TODO: example