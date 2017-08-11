'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var babel = require('gulp-babel');

gulp.task('build', function() {
  return gulp.src(['src/core/main.js'])
    .pipe(concat('hamsters.js'))
    .pipe(babel())
    .on('error', function (err) {
    		gutil.log(gutil.colors.red('[Error]'), err.toString());
    	}
    ).pipe(gulp.dest('build'));
})