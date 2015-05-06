'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload;

//////////////////////////////
// Internal Vars
//////////////////////////////
var toImagemin = [
  'language/images/**/*',
  'library/images/**/*'
];

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp, ImageminPaths) {
  // Set value of paths to either the default or user entered
  ImageminPaths = ImageminPaths || toImagemin;

  //////////////////////////////
  // Encapsulate task in function to choose path to work on
  //////////////////////////////
  var ImageminTask = function (path) {
    return gulp.src(ImageminPaths)
      .pipe(imagemin({
        progressive: true,
        svgoPlugins:[{removeViewBox: false}],
        use: [pngquant()]
      }))
      .pipe(gulp.dest('www/images'))
      .pipe(reload({stream: true}));
  }

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('imagemin', function () {
    return ImageminTask(ImageminPaths);
  });

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('imagemin:watch', function () {
    return gulp.watch(ImageminPaths)
      .on('change', function (event) {
        // Add absolute and relative (to Gulpfile) paths
        event.path = {
          absolute: event.path,
          relative: event.path.replace(__dirname.replace('/tasks', '') + '/', '')
        }

        // Notify user of the change
        gutil.log('File ' + gutil.colors.magenta(event.path.relative) + ' was ' + event.type);

        // Call the task
        return ImageminTask(event.path.absolute);
      });
  });
}
