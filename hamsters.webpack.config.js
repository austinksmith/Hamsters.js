const webpack = require('webpack');
const webpackSettings = require('./webpack.config');

const optimizingPlugins = [
  new webpack.optimize.OccurrenceOrderPlugin,
  new webpack.optimize.UglifyJsPlugin,
];

webpackSettings.plugins = optimizingPlugins;

module.exports = webpackSettings;
