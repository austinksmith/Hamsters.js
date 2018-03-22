const path = require('path');
const webpack = require('webpack');

const web = {
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
  plugins: webpack.plugins,
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
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin,
    new webpack.optimize.UglifyJsPlugin({
        include: /\.min\.js$/,
        minimize: true
    }),
  ]
};

const node = {
  target: 'node',
  devtool: 'sourcemap',
  entry: [
    './src/hamsters',
  ],
  output: {
    path: path.resolve('./build'),
    filename: 'hamsters.node.min.js',
    library: 'hamsters',
    libraryTarget: 'commonjs2'
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
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin,
    new webpack.optimize.UglifyJsPlugin({
        include: /\.min\.js$/,
        minimize: true
    }),
  ]
};

module.exports = [
  web,
  node
];