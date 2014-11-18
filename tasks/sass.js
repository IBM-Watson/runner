'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    run = require('gulp-run'),
    compass = require('gulp-simple-compass'),
    cache = require('gulp-cached'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;

//////////////////////////////
// Internal Vars
//////////////////////////////
var toSass = [
  'patterns/**/*.scss',
  'patterns/**/*.sass'
];

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp, sassPaths) {
  // Set value of paths to either the default or user entered
  sassPaths = sassPaths || toSass;

  //////////////////////////////
  // Encapsulate task in function to choose path to work on
  //////////////////////////////
  var sassTask = function (path, fail) {
    return gulp.src(path)
      .pipe(cache('compass'))
      .pipe(compass({
        failOnError: fail
      }))
      .pipe(reload({stream: true}));
  }

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('sass', function () {
    return sassTask(sassPaths, true);
  });

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('sass-watch', function () {
    return gulp.watch(sassPaths)
      .on('change', function (event) {
        // Add absolute and relative (to Gulpfile) paths
        event.path = {
          absolute: event.path,
          relative: event.path.replace(__dirname.replace('/tasks', '') + '/', '')
        }

        // Notify user of the change
        gutil.log('File ' + gutil.colors.magenta(event.path.relative) + ' was ' + event.type);

        // Call the task
        return sassTask(event.path.absolute, false);
      });
  });
}
