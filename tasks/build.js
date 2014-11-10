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
    sequence(
      // Linting
      ['scsslint', 'eslint'],

      // Compass
      ['sass'],

      // Sequence Callback
      cb
    );
  });
}
