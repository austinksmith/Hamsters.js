const webpack = require('webpack');
const webpackSettings = require('./webpack.config');

const optimizingPlugins = [
  new webpack.optimize.OccurrenceOrderPlugin,
  new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
  }),
];

webpackSettings.plugins = optimizingPlugins;

module.exports = webpackSettings;
