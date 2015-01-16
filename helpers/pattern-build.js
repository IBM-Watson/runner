'use strict';

//////////////////////////////
// Variables
//////////////////////////////
var through = require('through2'),
    gutil = require('gulp-util'),
    swig = require('swig'),
    swigInclude = require('swig/lib/tags/include').compile,
    yaml = require('js-yaml'),
    path = require('path'),
    fs = require('fs-extra'),
    marked = require('./markdown'),
    PluginError = gutil.PluginError,
    PLUGIN_NAME = 'pattern-build';

//////////////////////////////
// Pattern Swig Tag
//////////////////////////////
var swigPatternTag = {
  parse: function (str, line, parser, types, options) {
    // Start of a parse
    parser.on('start', function () {

    });

    // Match of any token
    parser.on('*', function (token) {
      if (token.type !== 0 && token.match !== 'from') {
        this.out.push(token.match)
      }
    });

    // End of parse
    parser.on('end', function () {
      this.out.push(options.filename || null);
    });

    // Parser is good to go
    return true;
  },
  compile: function (compiler, args) {
    var file = '"patterns/' + args[1] + '/' + args[0] + '/' + args[0] + '.html"',
        pattern = 'pattern ' + args[0] + ' from ' + args[1];

    return '_output += "\\n<!-- {% ' + pattern + ' %} -->\\n" + _swig.compileFile(' + file + ')(_ctx) + "<!-- {% end ' + pattern + ' %} -->\\n";\n';
  },
  ends: false
}

swig.setTag(
  'pattern',
  swigPatternTag.parse,
  swigPatternTag.compile,
  swigPatternTag.ends
);

//////////////////////////////
// Compiling
//////////////////////////////
var patternCompile = function (paths, file) {
  var meta = {},
      vars = {},
      template = '',
      render = '',
      patternPath = paths.folder + '/pattern.yml';

  if (fs.existsSync(patternPath)) {
    meta = yaml.safeLoad(fs.readFileSync(patternPath, 'utf8'));
  }

  vars = meta.variables || {};

  render = swig.render(file, { locals: vars });

  return {
    'contents': new Buffer(render),
    'meta': meta
  };
}

var templateCompile = function (paths, file, options) {
  var render = '',
      readme = '',
      templatePath = 'library/templates/',
      pageTemplate = file.meta.pageTemplate ? file.meta.pageTemplate : templatePath + '_layout.html',
      options = options || {},
      layout = {},
      pattern = {};

  if (fs.existsSync(paths.folder + '/readme.md')) {
    readme = fs.readFileSync(paths.folder + '/readme.md', 'utf8');
  }
  else if (fs.existsSync(paths.folder + '/README.md')) {
    readme = fs.readFileSync(paths.folder + '/README.md', 'utf8');
  }

  readme = marked(readme);

  pattern = {
    'markup': file.contents.toString(),
    'readme': readme,
    'metadata': file.meta
  };

  //////////////////////////////
  // Render the content
  //////////////////////////////
  if (file.meta.displayTemplate) {
    render = swig.compileFile(templatePath + '_' + file.meta.displayTemplate + '.html')({
      'pattern': pattern
    });
  }
  else {
    render = pattern.markup;
  }

  if (options.page) {
    //////////////////////////////
    // Add the Layout
    //////////////////////////////
    layout = {
      'title': ' | ' + file.meta.name,
      'content': render
    };

    render = swig.compileFile(pageTemplate)({
      'layout': layout
    });
  }

  return new Buffer(render);
}


//////////////////////////////
// Export Gulp plugin
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
        case '--template': options.template = true; break;
        case '--page': options.page = true; break;
      }
    }
  });

  var compile = through.obj(function (file, encoding, cb) {
    var paths = {
      absolute: file.path,
      relative: file.path.replace(process.cwd() + '/', ''),
      folder: file.path.replace(process.cwd() + '/', '').split('/').slice(0, -1).join('/'),
      inner: file.path.replace(process.cwd() + '/', '').split('/').slice(1, -1).join('/')
    };
    var pattern,
        meta,
        readme,
        fileContents;

    //////////////////////////////
    // Deal with errors and such
    //////////////////////////////
    if (file.isNull()) {
      return cb();
    }
    if (file.isStream()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported!'));
      return cb();
    }

    //////////////////////////////
    // Transform stuff!
    //////////////////////////////
    if (path.extname(paths.absolute) === '.html') {
      fileContents = fs.readFileSync(paths.relative, 'utf8');

      pattern = patternCompile(paths, fileContents);

      file.contents = (options.template === true) ? templateCompile(paths, pattern, options) : pattern.contents;

      if (options.page === true) {
        file.path = paths.folder + '/index.html';
      }


      // Tell the user that stuff's gone down.
      gutil.log('Pattern ' + gutil.colors.magenta(paths.inner) + ' compiled');
    }

    //////////////////////////////
    // Buffer Goodness
    //////////////////////////////
    this.push(file);

    // Callback
    cb();
  });

  return compile;
}
