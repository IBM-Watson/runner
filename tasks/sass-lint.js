'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    lint = require('gulp-scss-lint');

//////////////////////////////
// Internal Vars
//////////////////////////////
var toSassLint = [
  'patterns/**/*.scss',
  'patterns/**/*.sass'
];

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp, sassLintPaths) {
  // Set value of paths to either the default or user entered
  sassLintPaths = sassLintPaths || toSassLint;

  //////////////////////////////
  // Encapsulate task in function to choose path to work on
  //////////////////////////////
  var sassLintTask = function (path) {
    return gulp.src(path)
      .pipe(lint({
        'bundleExec': true
      }));
  }

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('sass-lint', function () {
    return sassLintTask(sassLintPaths);
  });

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('sass-lint-watch', function () {
    return gulp.watch(eslintPaths)
      .on('change', function (event) {
        // Add absolute and relative (to Gulpfile) paths
        event.path = {
          absolute: event.path,
          relative: event.path.replace(__dirname.replace('/tasks', '') + '/', '')
        }

        // Notify user of the change
        gutil.log('File ' + gutil.colors.magenta(event.path.relative) + ' was ' + event.type);

        // Call the task
        return sassLintTask(event.path.absolute);
      });
  });
}
