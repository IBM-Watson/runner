'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    front = require('gulp-front-matter'),
    browserSync = require('browser-sync'),
    swig = require('../helpers/page-build'),
    dest = require('../helpers/relative-dest'),
    reload = browserSync.reload;

//////////////////////////////
// Internal Vars
//////////////////////////////
var toPageBuild = [
  'tmp/**/*.html'
];

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp, PageBuildPaths) {
  // Set value of paths to either the default or user entered
  PageBuildPaths = PageBuildPaths || toPageBuild;

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('page-build', function (cb) {
    swig({}, function () {
      browserSync.reload();
      cb();
    });
  });

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('page-build:watch', function () {
    return gulp.watch(PageBuildPaths)
      .on('change', function (event) {
        swig({}, function () {
          browserSync.reload();
        });
      });
  });
}
