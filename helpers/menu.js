var fs = require('fs-extra'),
    path = require('path'),
    util = require('util'),
    fm = require('front-matter'),
    gutil = require('gulp-util'),
    through = require('through2'),
    swig = require('./swig.js'),
    time = require('microtime'),
    _s = require('underscore.string');

var base = process.cwd() + '/tmp';

//////////////////////////////
// Get a list of directories
//////////////////////////////
var inspect = function (object) {
  console.log(util.inspect(object, false, null));
}

var makeTitle = function makeTitle (string) {
  return  _s.titleize(_s.humanize(string)).replace('Ui ', 'UI ').replace('Input ', 'Input - ');
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
    // gutil.log('Wrote ' + gutil.colors.magenta(url) + ' to redirect ' + gutil.colors.cyan(title));
  });
}

module.exports = function (options, cb) {
  options = options || {};

  var fin = {},
    mainNav = {},
    menu,
    start = time.now(),
    end;

  // fin['index'] = {
  //   'index': process.cwd() + '/tmp/index.html'
  // };

  fs.readFile(process.cwd() + '/tmp/index.html', 'utf-8', function (err, content) {
    if (err) throw err;

    fs.outputFile(process.cwd() + '/www/index.html', contentBuild(content), function (err) {
      if (err) throw err;
    });
  });

  getdirs(process.cwd() + '/tmp', function (err, dirs) {
    var key,
        section;

    menu = dirs.dirs;

    Object.keys(menu).forEach(function (dir) {
      fin[dir] = {};
      mainNav[dir] = {
        'title': menu[dir].title,
        'url': dir
      }
    });

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
              render = 0,
              subnav = [],
              i,
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

            // Get Subsections
            subnav.forEach(function (navSection) {
              var navSectionItems = getdirsSync(base + navSection.url);

              if (navSectionItems.index) {
                fin[key][navSection.url] = navSectionItems.base + '/index.html';
              }
              else {
                Object.keys(navSectionItems.dirs).forEach(function (subNavSection) {
                  fin[key][navSection.url + '/' + subNavSection] = navSectionItems.base + '/' + subNavSection + '/index.html';
                });
              }
            });
          }
          else {
            if (subsections.index) {
              menu[key].sections[section].url = '/' + key + '/' + section;

              fin[key]['/' + key + '/' + section] = subsections.base + '/index.html';
            }
          }
        });

        Object.keys(fin[key]).forEach(function (renderKey) {
          outputFile(key, renderKey);
        });
      });
    });
  });

  var contentBuild = function contentBuild (content, key) {
    var templatePath = 'library/templates/',
        title = ' | ',
        pageTemplate,
        subNav,
        layout,
        title,
        render;

    content = fm(content);
    pageTemplate = content.attributes.pageTemplate ? content.attributes.pageTemplate : templatePath + '_layout.html';

    if (key) {
      title += menu[key].title + ' - '

      if (content.attributes.name) {
        title += content.attributes.name;
      }
      else if (content.attributes.title) {
        title += content.attributes.title;
      }
      else {
        title = '';
      }
    }
    else {
      title = '';
    }

    if (menu[key] && menu[key].sections) {
      subnav = menu[key].sections;
    }

    layout = {
      'title': title,
      'content': content.body,
      'navigation': {
        'main': mainNav,
        'sub': subNav
      }
    };

    render = swig.compileFile(pageTemplate)({
      'layout': layout
    });

    return render;
  };

  var outputFile = function outputFile (key, renderKey) {

    fs.readFile(fin[key][renderKey], 'utf-8', function (err, content) {
      if (err) throw err;

      fs.outputFile(process.cwd() + '/www' + renderKey + '/index.html', contentBuild(content, key), function (err) {
        if (err) throw err;

        // gutil.log('Wrote ' + gutil.colors.magenta(renderKey.substring(1)) + ' with title ' + gutil.colors.cyan(layout.title.substring(3)));

        delete fin[key][renderKey];

        if (Object.keys(fin[key]).length === 0) {
          delete fin[key];

          if (Object.keys(fin).length === 0) {
            end = time.now();
            gutil.log('Guide rebuilt after ' + gutil.colors.magenta(Math.round((end - start) / 1000) + 'ms'));
            cb();
            // console.timeEnd('render');
          }
        }
      });
    });
  }
}
