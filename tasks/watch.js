'use strict';

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp) {

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('watch', ['server', 'eslint-watch']);
}
