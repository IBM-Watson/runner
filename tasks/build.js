'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    sequence = require('run-sequence');

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp) {

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('build', function (cb) {
    return sequence(
      // Linting
      ['lint', 'sass:fix-libsass'],

      // Pre-Compiled Files
      ['sass', 'swig', 'language', 'imagemin', 'copy', 'assets'],

      // Post-Compiled Files
      ['css', 'page-build'],

      // Sequence Callback
      cb
    );
  });

  //////////////////////////////
  // Server Initialization Task
  //////////////////////////////
  gulp.task('build:server', function (cb) {
    return sequence(
      // Linting
      ['lint:server', 'sass:fix-libsass'],

      // Pre-Compiled Files
      ['sass:server', 'swig:server', 'language', 'imagemin', 'copy', 'assets'],

      // Post-Compiled Files
      ['css', 'page-build'],

      // Sequence Callback
      cb
    );
  });
}
