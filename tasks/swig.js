'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    swig = require('../helpers/pattern-build'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;

//////////////////////////////
// Internal Vars
//////////////////////////////
var toSwig = [
  './patterns/**/*.html'
];

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp, SwigPaths) {
  // Set value of paths to either the default or user entered
  SwigPaths = SwigPaths || toSwig;

  //////////////////////////////
  // Encapsulate task in function to choose path to work on
  //////////////////////////////
  var SwigTask = function (path, page) {
    return gulp.src(SwigPaths)
      .pipe(swig({
        'template': true,
        'page': page === undefined ? false : page
      }))
      .pipe(gulp.dest('./www/'))
      .pipe(reload({stream: true}));
  }

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('swig', function () {
    return SwigTask(SwigPaths);
  });

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('swig:watch', function () {
    return gulp.watch(SwigPaths)
      .on('change', function (event) {
        // Add absolute and relative (to Gulpfile) paths
        event.path = {
          absolute: event.path,
          relative: event.path.replace(__dirname.replace('/tasks', '') + '/', '')
        }

        // Notify user of the change
        gutil.log('File ' + gutil.colors.magenta(event.path.relative) + ' was ' + event.type);

        // Call the task
        return SwigTask(event.path.absolute, true);
      });
  });
}
