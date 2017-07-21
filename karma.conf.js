const fs = require('fs')
const path = require('path')

const webpackConfig = require('./webpack.config.js')

module.exports = (config) => {

  const tsconfig = require('./tsconfig.json')

  config.set({
    frameworks: ['mocha'],
    browsers: ['Firefox'],
    files: [
      'node_modules/search-index/dist/search-index.js',
      'src/search/**/*[!d].ts',
      { pattern: 'src/script.ts', included: false, served: true },
      'src/script.test.ts',
      { pattern: 'src/search/*.gz', watched: false, included: false, served: true, nocache: false }
    ],

    client: {
      mocha: {
        // change Karma's debug.html to the mocha web reporter
        // reporter: 'html',

        timeout: 30000    // 30 sec
      }
    },

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
