'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util');

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp) {

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('lint', ['eslint']);

  //////////////////////////////
  // Server Initialization Task
  //////////////////////////////
  gulp.task('lint:server', ['eslint:server']);

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('lint:watch', ['eslint:watch']);
}
