//////////////////////////////
// library-build
//  - A Gulp Plugin
//
// 'Builds markdown files into HTML'
//////////////////////////////
'use strict';

//////////////////////////////
// Variables
//////////////////////////////
var through = require('through2'),
    gutil = require('gulp-util'),
    fs = require('fs-extra'),
    marked = require('./markdown'),
    swig = require('./swig'),
    yaml = require('js-yaml'),
    PluginError = gutil.PluginError,
    PLUGIN_NAME = 'library-build';

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (options) {
  options = options || {};

  //////////////////////////////
  // Command line arguments for each option
  //////////////////////////////
  process.argv.forEach(function (val, index, array) {
    if (index >= 3) {
      switch (val) {
        case '--fail': options.failOnError = true; break;
      }
    }
  });

  var templateCompile = function (file) {
    var render = marked(file.contents.toString());

    render = '---\n' + yaml.safeDump(file.meta) + '---\n' + '<div class="base--STYLED">\n' + render + '</div>';

    return new Buffer(render);
  }

  //////////////////////////////
  // Through Object
  //////////////////////////////
  var compile = through.obj(function (file, encoding, cb) {
    var paths = {
      'relative': file.path.replace(process.cwd() + '/', ''),
      'folder': file.path.replace(process.cwd() + '/', '').split('/').slice(0, -1).join('/'),
      'inner': file.path.replace(process.cwd() + '/', '').split('/').slice(1, -1).join('/')
    };

    /////////////////////////////
    // Default plugin issues
    //////////////////////////////
    if (file.isNull()) {
      return cb();
    }
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }

    //////////////////////////////
    // Manipulate Files
    //////////////////////////////
    file.contents = templateCompile(file);
    file.path = paths.folder + '/index.html';

    gutil.log('Page ' + gutil.colors.magenta(paths.relative) + ' compiled');

    //////////////////////////////
    // Push the file back to the stream!
    //////////////////////////////
    this.push(file);

    //////////////////////////////
    // Callback to tell us we're done
    //////////////////////////////
    cb();
  })

  return compile;
}
