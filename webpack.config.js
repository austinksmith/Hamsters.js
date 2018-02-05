const path = require('path');
const webpack = require('webpack');

const browser = {
  target: 'web',
  devtool: 'sourcemap',
  entry: [
    './src/hamsters',
  ],
  output: {
    path: path.resolve('./build'),
    filename: 'hamsters.web.min.js',
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
    ]
  }
};

module.exports = [
  browser
];