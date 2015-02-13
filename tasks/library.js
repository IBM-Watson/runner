'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    browserSync = require('browser-sync'),
    front = require('gulp-front-matter'),
    swig = require('../helpers/library-build'),
    dest = require('../helpers/relative-dest'),
    reload = browserSync.reload;

//////////////////////////////
// Internal Vars
//////////////////////////////
var toLibrary = [
  'library/**/*.md',
  '!library/bower_components/**/*'
];

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp, LibraryPaths) {
  // Set value of paths to either the default or user entered
  LibraryPaths = LibraryPaths || toLibrary;

  //////////////////////////////
  // Encapsulate task in function to choose path to work on
  //////////////////////////////
  var LibraryTask = function (path) {
    return gulp.src(LibraryPaths)
      .pipe(front({ property: 'meta' }))
      .pipe(swig())
      .pipe(dest('./www/'))
      .pipe(reload({stream: true}));
  }

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('library', function () {
    return LibraryTask(LibraryPaths);
  });

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('library:watch', function () {
    return gulp.watch(LibraryPaths)
      .on('change', function (event) {
        // Add absolute and relative (to Gulpfile) paths
        event.path = {
          absolute: event.path,
          relative: event.path.replace(__dirname.replace('/tasks', '') + '/', '')
        }

        // Notify user of the change
        gutil.log('File ' + gutil.colors.magenta(event.path.relative) + ' was ' + event.type);

        // Call the task
        return LibraryTask(event.path.absolute);
      });
  });
}
