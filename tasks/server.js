'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;

//////////////////////////////
// Internal Vars
//////////////////////////////
var toServer = [
  './'
];

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp, serverPaths) {
  // Set value of paths to either the default or user entered
  serverPaths = serverPaths || toServer;

  //////////////////////////////
  // Encapsulate task in function to choose path to work on
  //////////////////////////////
  var serverTask = function (path) {
    return browserSync({
      server: {
        baseDir: path
      }
    });
    // return gulp.src(serverPaths)
    //   .pipe(reload({stream: true}));
  }

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('broswer-sync', function () {
    return serverTask(serverPaths);
  });

  //////////////////////////////
  // Full Server Task
  //////////////////////////////
  gulp.task('server', ['browser-sync', 'watch']);
  gulp.task('serve', ['server']);
}
