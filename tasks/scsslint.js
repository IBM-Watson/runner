'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    ifElse = require('gulp-if-else'),
    stylish = require('eslint/lib/formatters/stylish'),
    scsslint = require('gulp-scss-lint');

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
  // Custom Reporter
  //////////////////////////////
  var sassLintReporter = function (file) {
    if (!file.scsslint.success) {
      var report = {};

      report.filePath = file.path;
      report.messages = [];

      // Add Filename
      file.scsslint.issues.forEach(function (v) {
        var message = {};

        // Set severity
        if (v.severity === 'error') {
          message.severity = 2;
        }
        else {
          message.severity = 1;
        }

        // Set line and columns
        message.line = v.line;
        message.column = v.column;
        message.message = v.reason;
        message.ruleId = v.linter;

        report.messages.push(message);
      });
      // Pass to Stylish
      gutil.log(stylish([report]));
    }
  };

  //////////////////////////////
  // Encapsulate task in function to choose path to work on
  //////////////////////////////
  var sassLintTask = function (path, fail) {
    return gulp.src(path)
      .pipe(scsslint({
        'bundleExec': true,
        'customReport': sassLintReporter
      }))
      .pipe(ifElse(fail === true, scsslint.failReporter));
  }

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('scsslint', function () {
    return sassLintTask(sassLintPaths, true);
  });

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('scsslint:watch', function () {
    return gulp.watch(sassLintPaths)
      .on('change', function (event) {
        // Add absolute and relative (to Gulpfile) paths
        event.path = {
          absolute: event.path,
          relative: event.path.replace(__dirname.replace('/tasks', '') + '/', '')
        }

        // Notify user of the change
        gutil.log('File ' + gutil.colors.magenta(event.path.relative) + ' was ' + event.type);

        // Call the task
        return sassLintTask(event.path.absolute, false);
      });
  });
}
