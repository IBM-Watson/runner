//////////////////////////////
// Page Build
//  - A Gulp Plugin
//
// Builds a page out of fragments
//////////////////////////////
'use strict';

//////////////////////////////
// Variables
//////////////////////////////
var through = require('through2'),
    gutil = require('gulp-util'),
    fs = require('fs-extra'),
    fm = require('front-matter'),
    walker = require('fs-walk-glob-rules'),
    _s = require('underscore.string'),
    buildMenuJSON = require('./build-menu'),
    swig = require('./swig'),
    time = require('microtime'),
    spacing = '',
    nav = '';

//////////////////////////////
// Walk ALL the things!
//////////////////////////////
var buildFiles = function buildFiles (nav, cb) {
  var walked = walker.transformSync({
    root: process.cwd() + '/tmp/',
    rules: {
      '**/*.html': '$1'
    }
  }),
  counter = 0;

  walked.forEach(function (file) {
    fs.readFile(file.path, 'utf-8', function (err, data) {
      var content = fm(data),
        templatePath = 'library/templates/',
        pageTemplate = content.attributes.pageTemplate ? content.attributes.pageTemplate : templatePath + '_layout.html',
        layout,
        title,
        render;

      // Build the relative path
      var path = file.relative.split('/'),
          pFinal = '',
          pHolder = '';
      path.pop();
      path.shift();
      pFinal = path.join('/');
      content.path = pFinal + '/index.html';

      layout = {
        'title': content.attributes.name ? ' | ' + content.attributes.name : '',
        'content': content.body,
        'heading': {
          'navigation': nav
        }
      };

      render = swig.compileFile(pageTemplate)({
        'layout': layout
      });

      fs.outputFile(process.cwd() + '/www/' + content.path, render, function (err) {
        counter++;
        if (counter === walked.length) {
          cb();
        }
      });
    });
  });

  return 'done';
}

//////////////////////////////
// Build Nav
//////////////////////////////
var buildNav = function buildNav (menu) {
  // _s.humanize();
  nav = '<nav library-class="navigation" role="navigation">\n';

  menu.forEach(function (section) {
    nav += buildMenu([section]);
  });

  nav += '</nav>';
  return nav;
}

var buildMenu = function buildMenu (menu, submenu) {
  var menuList = '';

  spacing = spacing + '  ';

  submenu = submenu ? 'menu--inner' : 'menu';

  menuList += spacing + '<ul library-class="' + submenu + '">\n';
  menu.forEach(function (item) {
    menuList += buildMenuItem(item);
  });
  menuList += spacing + '</ul>\n';

  spacing = spacing.substring(0, spacing.length - 2);

  return menuList;
}

var buildMenuItem = function buildMenuItem (item) {
  var listItem = '';

  spacing = spacing + '  ';

  listItem += spacing;

  if (!item.skip) {
    if (item.submenu && item.submenu.length) {
      listItem += '<li library-class="menu--dropdown">';
      listItem += '<a href="/' + _s.slugify(item.title) + '" library-class="menu--dropdown-toggle">' + item.title + '</a>\n';
      listItem += buildMenu(item.submenu, true);
      listItem += spacing + '</li>\n';
    }
    else {
      if (item.href) {
        listItem += '<li library-class="menu--item">';
        listItem += '<a href="' + item.href + '" library-class="menu--link">' + item.title + '</a>';
        listItem += '</li>\n';
      }
    }
  }

  spacing = spacing.substring(0, spacing.length - 2);

  return listItem;
}

//////////////////////////////
// Export
//////////////////////////////
module.exports = function (options, cb) {
  options = options || {};

  var start = time.now();

  buildMenuJSON(process.cwd() + '/tmp', ['.html'], true, function (menu) {
    menu = buildNav(menu);

    var files = buildFiles(menu, function () {
      var end = time.now(),
        total = Math.round((end - start) / 1000);

      gutil.log('Library rebuilt after ' + gutil.colors.magenta(total + 'ms'));
      cb();
    });
  });

  // var found = findStuff();
  // var menu = buildNav(found.dirs, found.parents);
  // console.log(menu);
}
