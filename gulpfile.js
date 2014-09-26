var gulp = require('gulp');
var browserify = require('browserify');
var less = require('gulp-less');
var path = require('path');
var uglify = require('gulp-uglify');
var traceur = require('gulp-traceur');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');

var es6ify = require('es6ify');
es6ify.traceurOverrides = { modules: 'commonjs', sourceMaps: true };

gulp.task('browserify-dev', function() {
  return browserify('./src/js/main.js', { debug: true })
  .transform(es6ify)
  .bundle()
  .pipe(source('main.js'))
  .pipe(buffer())
  .pipe(gulp.dest('./dist/js/'));
});

gulp.task('browserify-prod', function() {
  return browserify('./tmp/js/main.js', { debug: true })
  .transform(es6ify)
  .bundle()
  .pipe(source('main.js'))
  .pipe(buffer())
  .pipe(uglify())
  .pipe(gulp.dest('./dist/js/'));
});

gulp.task('copy', function() {
  gulp.src('src/index.html')
  .pipe(gulp.dest('dist'));
});

gulp.task('less', function () {
  gulp.src('src/css/main.less')
  .pipe(less({
    paths: [ path.join(__dirname, 'less', 'includes') ]
  }))
  .pipe(gulp.dest('dist/css'));
});

gulp.task('default', ['browserify-dev', 'less', 'copy']);
gulp.task('prod', ['browserify-prod', 'less', 'copy']);

gulp.task('watch', function() {
  gulp.watch('src/**/*.*', ['default']);
});
