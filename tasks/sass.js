'use strict';

//////////////////////////////
// Requires
//////////////////////////////
var gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    fs = require('fs-extra'),
    ifElse = require('gulp-if-else'),
    importOnce = require('node-sass-import-once'),
    dest = require('../helpers/relative-dest');

//////////////////////////////
// Internal Vars
//////////////////////////////
var toSass = [
  'patterns/**/*.scss',
  'patterns/**/*.sass'
];

var sassSettings = {
  'importer': importOnce,
  'importOnce': {
    'index': true,
    'css': false,
    'bower': true
  }
};

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (gulp, sassPaths) {
  // Set value of paths to either the default or user entered
  sassPaths = sassPaths || toSass;

  //////////////////////////////
  // TERRIBLE HORRIBLE HACK BECAUSE THINGS ARE TERRIBLE AND HORRIBLE WITH LIBSASS RIGHT NOW
  //////////////////////////////
  gulp.task('sass:fix-libsass', function (cb) {
    var files = [
      'bower_components/modular-scale/stylesheets/modular-scale/_sort-list.scss'
    ];

    files.forEach(function (path) {
      var file = fs.readFileSync(path, 'utf-8');
      file = file.replace(/\@elseif/g, '@else if');
      fs.writeFileSync(path, file);
    });

    cb();
  });

  //////////////////////////////
  // Encapsulate task in function to choose path to work on
  //////////////////////////////
  var sassTask = function (path) {
    return gulp.src(path)
      .pipe(sass(sassSettings).on('error', sass.logError))
      .pipe(dest('./www/css/'));
  };

  //////////////////////////////
  // Core Task
  //////////////////////////////
  gulp.task('sass', function () {
    return gulp.src(sassPaths)
      .pipe(sass(sassSettings))
      .pipe(dest('./www/css/'));
  });

  //////////////////////////////
  // Server Initialization Task
  //////////////////////////////
  gulp.task('sass:server', function () {
    return sassTask(sassPaths);
  });

  //////////////////////////////
  // Watch Task
  //////////////////////////////
  gulp.task('sass:watch', function () {
    return gulp.watch(sassPaths)
      .on('change', function (event) {
        // Add absolute and relative (to Gulpfile) paths
        event.path = {
          absolute: event.path,
          relative: event.path.replace(__dirname.replace('/tasks', '') + '/', '')
        }

        // Notify user of the change
        gutil.log('File ' + gutil.colors.magenta(event.path.relative) + ' was ' + event.type);

        // Call the task
        return sassTask(process.cwd() + '/patterns/crick.scss');
      });
  });
}
