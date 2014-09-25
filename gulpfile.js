var gulp = require('gulp');
var browserify = require('gulp-browserify');
var less = require('gulp-less');
var path = require('path');
var uglify = require('gulp-uglify');
var traceur = require('gulp-traceur');

gulp.task('browserify', function() {
  gulp.src('src/js/main.js')
    .pipe(browserify({
      insertGlobal: true,
      debug: true
    }))
    .pipe(traceur({modules: 'commonjs', sourceMaps: true}))
    .pipe(uglify())
    .pipe(gulp.dest('dist/js'));
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

gulp.task('default', ['browserify', 'less', 'copy']);

gulp.task('watch', function() {
  gulp.watch('src/**/*.*', ['default']);
});
