const webpack = require('webpack')
const path = require('path')

const config = {
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

  context: path.join(__dirname, 'src'),
  entry: {
    search: ['./search.ts']
  },
  output: {
    path: path.join(__dirname, 'dist/'),
    publicPath: '/',
    filename: '[name].js',
    chunkFilename: '[name].js'
  }
}

module.exports = config