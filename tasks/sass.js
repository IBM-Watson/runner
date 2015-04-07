'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    importOnce = require('node-sass-import-once'),
    dest = require('../helpers/relative-dest');

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
  var sassTask = function (path, fail, watch) {
    return gulp.src(path)
      .pipe(sass({
        'importer': importOnce,
        'importOnce': {
          'index': true,
          'css': true,
          'bower': true
        }
      }).on('error', sass.logError))
      .pipe(dest('./www/css/'));
  };

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('sass', function () {
    return sassTask(sassPaths, false);
  });

  //////////////////////////////
  // Server Initialization Task
  //////////////////////////////
  gulp.task('sass:server', function () {
    return sassTask(sassPaths, true);
  });

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('sass:watch', function () {
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
        return sassTask(process.cwd() + '/patterns/crick.scss', true);
      });
  });
}
