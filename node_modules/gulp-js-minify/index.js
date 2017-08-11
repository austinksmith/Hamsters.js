'use strict';
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;
var through2 = require('through2');
var packer = require('./packer.js');

module.exports = function(options) {
  return through2.obj(function(file, enc, cb) {

    if (file.isNull()) {
      return cb(null, file);
    }

    if (file.isStream()) {
      return cb(new PluginError('gulp-js-minify', 'Stream is not supported'));
    }

    var str = file.contents.toString('utf8');
    file.contents = new Buffer(packer.minifyScript(str));

    return cb(null, file);
  });
}
