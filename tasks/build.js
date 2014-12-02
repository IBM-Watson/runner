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
      ['css'],

      // Sequence Callback
      cb
    );
  });

      // Sequence Callback
      cb
    );
  });
}
