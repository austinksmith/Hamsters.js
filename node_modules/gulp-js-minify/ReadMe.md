# gulp-js-minify

Gulp plugin to use [packer](http://dean.edwards.name/packer)

## Install

```
npm install --save-dev gulp-js-minify
```

## Usage

```
var minifyjs = require('gulp-js-minify');

gulp.task('minify-js', function(){
  gulp.src('./dist/a.js')
    .pipe(minifyjs())
    .pipe(gulp.dest('./dist/'));
});
```
