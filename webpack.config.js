const path = require('path');
const webpack = require('webpack');

module.exports = {
  devtool: 'sourcemap',
  entry: [
    'babel-polyfill',
    './src/core',
  ],
  output: {
    path: path.resolve('./build'),
    filename: 'hamsters.js',
  },
  module: {
    loaders: [
      {
        test: [/\.js?$/],
        exclude: path.resolve(__dirname, 'node_modules'),
        loader: 'babel',
        query: {
          presets: ['es2015'],
        },
      }
    ],
  }
};
