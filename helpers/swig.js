'use strict';

//////////////////////////////
// Variables
//////////////////////////////
var swig = require('swig');

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
// Export Swig
//////////////////////////////
module.exports = swig;
