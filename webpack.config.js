const path = require('path');
const webpack = require('webpack');

module.exports = {
  devtool: 'sourcemap',
  entry: [
    './src/core',
  ],
  output: {
    path: path.resolve('./build'),
    filename: 'hamsters.min.js',
    library: 'hamsters',
    libraryTarget: 'var'
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
