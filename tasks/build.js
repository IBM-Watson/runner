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
      'lint',

      // Pre-Compiled Files
      ['sass', 'swig'],

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
      'lint:server',

      // Pre-Compiled Files
      ['sass:server', 'swig:server'],

      // Post-Compiled Files
      ['css', 'page-build'],

      // Sequence Callback
      cb
    );
  });
}
