const fs = require('fs')
const path = require('path')

const webpackConfig = require('./webpack.config.js')

module.exports = (config) => {

  const tsconfig = require('./tsconfig.json')

  config.set({
    frameworks: ['mocha'],
    reporters: ['mocha'],
    browsers: ['Firefox'],
    files: [
        // search-index needs to be loaded in the browser
      'node_modules/search-index/dist/search-index.js',
        // all our source files should be included as modules by webpack
      'src/lib/**/*[!d].ts',
        // "search.ts" will be injected by the search.test.ts test file in the test setup
      { pattern: 'src/search.ts', included: false, served: true },
      'src/search.test.ts',
        // the gzipped search index needs to be available.
      { pattern: 'src/lib/search/test_search*', watched: false, included: false, served: true, nocache: false }
    ],

    client: {
      mocha: {
        // change Karma's debug.html to the mocha web reporter
        // reporter: 'html',

        timeout: 30000    // 30 sec
      }
    },
    browserDisconnectTimeout:  5000,
    browserNoActivityTimeout: 30000,

    logLevel: 'LOG_DEBUG',

    preprocessors: {
      'src/**/*.ts': ['webpack']
    },

    mime: {
      "text/x-typescript": ["ts", "tsx"]
    },

    webpack: {
      target: 'web',

      resolve: {
        extensions: ['.js', '.json', '.ts'],
      },

      module: {
        loaders: [
          {
            loader: 'babel-loader',
            test: /\.jsx?$/,
            exclude: /node_modules/
          },
          {
            // Typescript compiled by awesome-typescript-loader
            // targeting ES2015 then passed to Babel for backwards compatibility.
            loaders: ['babel-loader', 'awesome-typescript-loader'],
            test: /\.tsx?$/,
            exclude: /node_modules/
          }
        ]
      },

      externals: {
        // loaded separately in the browser
        'search-index': 'SearchIndex'
      },

      devtool: 'source-map',

      plugins: [
      ],
    }

  })
}
