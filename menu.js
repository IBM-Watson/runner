var fs = require('fs-extra'),
    path = require('path'),
    util = require('util'),
    gutil = require('gulp-util'),
    _s = require('underscore.string');

var base = process.cwd() + '/tmp';

//////////////////////////////
// Get a list of directories
//////////////////////////////
var inspect = function (object) {
  console.log(util.inspect(object, false, null));
}

var makeTitle = function makeTitle (string) {
  return  _s.titleize(_s.humanize(string)).replace('Ui ', 'UI ');
}

var processDirs = function processDirs (files, base) {
  var results = {
    'dirs': {},
    'index': false,
    'base': base
  };

  if (files.indexOf('index.md') >= 0 || files.indexOf('index.html') >= 0) {
    results.index = true;
  }

  files.forEach(function (file) {
    var dir = path.resolve(base, file),
        name = makeTitle(file);
    dir = fs.statSync(dir);
    if (dir.isDirectory()) {
      results.dirs[file] = {
        'title': name
      };
    }
  });

  return results;
}

var getdirs = function getDirs (base, cb) {
  fs.readdir(base, function (err, files) {
    var results;

    if (err) {
      throw err;
    }

    results = processDirs(files, base);

    cb(err, results);
  });
};

var getdirsSync = function (base) {
  var files = fs.readdirSync(base),
      reults;

  return processDirs(files, base);
}

var writeRedirectIndex = function writeRedirectIndex(redirect, title) {
  var refreshIndex = '<!DOCTYPE html><html lang="en"><head><meta http-equiv="refresh" content="0; url={{redirect}}" /><meta charset="UTF-8" /><title>Redirect</title></head><body><p>The first available page for <strong`>{{title}}</strong`> is <a href="{{redirect}}">{{redirect}}</a></p></body></html>';

  var url = redirect.split('/');

  if (url.length > 1) {
    url.pop();
    if (url[0] === '') {
      url.shift();
    }
  }

  url = url.join('/');

  refreshIndex = refreshIndex.replace(/\{\{redirect\}\}/g, redirect);
  refreshIndex = refreshIndex.replace(/\{\{title\}\}/g, title);

  fs.outputFile(process.cwd() + '/www/' + url + '/index.html', refreshIndex, function (err) {
    if (err) throw err;
    gutil.log('Wrote ' + gutil.colors.magenta(url) + ' to redirect ' + gutil.colors.cyan(title));
  });
}

getdirs(process.cwd() + '/tmp', function (err, dirs) {
  var menu = dirs.dirs,
      key,
      section;

  Object.keys(menu).forEach(function (dir) {


    getdirs(base + '/' + dir, function (err, sections) {
      key = sections.base.split('/');
      key = key[key.length - 1];

      menu[key].sections = sections.dirs;

      if (sections.index === false) {
        writeRedirectIndex('/' + key + '/' + Object.keys(menu[key].sections)[0], menu[key].title);
      }


      Object.keys(sections.dirs).forEach(function (section) {
        var subsections = getdirsSync(base + '/' + key + '/' + section),
            subnav = [],
            subnav;

        Object.keys(subsections.dirs).forEach(function (subsection) {
          var menuItem = {};

          menuItem.title = subsections.dirs[subsection].title;
          menuItem.url = '/' + key + '/' + section + '/' + subsection;



          subnav.push(menuItem);
        });


        if (subnav.length) {
          menu[key].sections[section].subnav = subnav;

          if (subsections.index === false) {
            writeRedirectIndex(menu[key].sections[section].subnav[0].url, menu[key].sections[section].title);
          }
        }
      });

      console.log(gutil.colors.cyan(key));
      inspect(menu[key]);
      console.log('\n');

    });
  });

});
