var fs = require('fs-extra'),
    path = require('path'),
    util = require('util'),
    fm = require('front-matter'),
    gutil = require('gulp-util'),
    through = require('through2'),
    swig = require('./swig.js'),
    time = require('microtime'),
    glob = require('glob'),
    htmlmin = require('html-minifier').minify,
    _s = require('underscore.string');

var base = process.cwd() + '/tmp';

//////////////////////////////
// Get a list of directories
//////////////////////////////
var inspect = function (object) {
  console.log(util.inspect(object, false, null));
}

var makeTitle = function makeTitle (string) {
  return _s.titleize(_s.humanize(string)).replace('Ui ', 'UI ').replace(' Url', ' URL').replace('Input ', 'Input - ').replace(/^([0-9]+\s)/g, '');
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

  var url = redirect.split('/'),
      redirPrts = [],
      urlPrts = [];

  if (url.length > 1) {
    url.pop();
    if (url[0] === '') {
      url.shift();
    }
  }

  url.forEach(function (urlp) {
    urlPrts.push(urlp.replace(/^([0-9]+\-)/g, ''));
  });

  redirect.split('/').forEach(function (redirp) {
    redirPrts.push(redirp.replace(/^([0-9]+\-)/g, ''));
  });

  url = urlPrts.join('/');
  redirect = redirPrts.join('/');

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
    undersection = {},
    nextPrev = {},
    absoluteMenu = {},
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
        mainNavBuild = [],
        index = false,
        section;

    menu = dirs.dirs;

    Object.keys(menu).forEach(function (dir) {
      fin[dir] = {};

      dir.split('/').forEach(function (dirPrt) {
        mainNavBuild.push(dirPrt.replace(/^([0-9]+\-)/g, ''));
      });

      mainNav[dir] = {
        'title': menu[dir].title,
        'url': mainNavBuild.join('/')
      }

      mainNavBuild = [];
    });

    Object.keys(menu).forEach(function (dir) {
      getdirs(base + '/' + dir, function (err, sections) {
        key = sections.base.split('/');
        key = key[key.length - 1];

        menu[key].sections = sections.dirs;
        nextPrev[key] = {};

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
            nextPrev[key][menuItem.url] = menuItem;
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

              if (navSectionItems.dirs) {
                Object.keys(navSectionItems.dirs).forEach(function (subNavSection) {
                  var content,
                      title;

                  fin[key][navSection.url + '/' + subNavSection] = navSectionItems.base + '/' + subNavSection + '/index.html';
                  // undersection
                  if (!undersection[navSection.url]) {
                    undersection[navSection.url] = {};
                  }

                  content = fs.readFileSync(navSectionItems.base + '/' + subNavSection + '/index.html', 'utf-8');

                  content = fm(content);

                  if (content.attributes.title) {
                    title = content.attributes.title;
                  }
                  else if (content.attributes.name) {
                    title = content.attributes.name;
                  }
                  else {
                    title = makeTitle(subNavSection);
                  }

                  undersection[navSection.url][subNavSection] = {
                    'title': title,
                    'description': content.attributes.description,
                    'url': navSection.url + '/' + subNavSection
                  }
                });
              }
            });
          }
          else {
            if (subsections.index) {
              menu[key].sections[section].url = '/' + key + '/' + section;
              nextPrev[key][menu[key].sections[section].url] = menu[key].sections[section];

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

  var contentBuild = function contentBuild (content, key, outputKey, renderKey) {
    var templatePath = 'library/templates/',
        title = ' | ',
        pageTemplate,
        pageTitle = '',
        next,
        prev,
        npLength,
        npPos,
        subNav,
        title,
        us = {
          'ag': {
            'title': 'A - G',
            'grouping': ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
            'children': []
          },
          'hn': {
            'title': 'H - N',
            'grouping': ['h', 'i', 'j', 'k', 'l', 'm', 'n'],
            'children': []
          },
          'ot': {
            'title': 'O - T',
            'grouping': ['o', 'p', 'q', 'r', 's', 't'],
            'children': []
          },
          'uz': {
            'title': 'U - Z',
            'grouping': ['u', 'v', 'w', 'x', 'y', 'z'],
            'children': []
          }
        },
        render;

    content = fm(content);
    pageTemplate = content.attributes.pageTemplate ? content.attributes.pageTemplate : templatePath + '_layout.html';

    if (key) {
      title += menu[key].title + ' - '

      if (content.attributes.name) {
        pageTemplate = content.attributes.name;
        title += pageTitle;
      }
      else if (content.attributes.title) {
        pageTemplate = content.attributes.title;
        title += pageTitle;
      }
      else {
        pageTitle = '';
        title = '';
      }
    }
    else {
      pageTemplate = '';
      title = '';
    }

    if (menu[key] && menu[key].sections) {
      subNav = menu[key].sections;
    }

    //////////////////////////////
    // Find Next/Previous
    //////////////////////////////

    if (key) {
      npLength = Object.keys(nextPrev[key]).length;
      npPos = Object.keys(nextPrev[key]).indexOf(renderKey);

      if (npPos !== 0) {
        prev = Object.keys(nextPrev[key])[npPos - 1];
        prev = nextPrev[key][prev];
      }

      if (npPos !== npLength - 1) {
        next = Object.keys(nextPrev[key])[npPos + 1];
        next = nextPrev[key][next]
      }

      if (npPos === -1) {
        prev = null;
        next = null;
      }
    }

    if (undersection[outputKey]) {
      Object.keys(undersection[outputKey]).forEach(function (usok) {
        Object.keys(us).forEach(function (usk) {
          if (us[usk].grouping.indexOf(usok.charAt(0)) !== -1) {
            us[usk].children.push(undersection[outputKey][usok]);
          }
        });
      });
    }


    //////////////////////////////
    // Build pretty Subnav
    //////////////////////////////
    if (subNav) {
      Object.keys(subNav).forEach(function (subnavItem, j) {
        var miholder = [];
        if (subNav[subnavItem].url) {
          subNav[subnavItem].url.split('/').forEach(function (mi) {
            miholder.push(mi.replace(/^([0-9]+\-)/g, ''));
          });
          if (j === 0) {
            absoluteMenu[key.replace(/^([0-9]+\-)/g, '')] = miholder.join('/');
          }
          subNav[subnavItem].url = miholder.join('/');
          miholder = [];
        }
        else if (subNav[subnavItem].subnav) {
          subNav[subnavItem].subnav.forEach(function (sna, k) {
            sna.url.split('/').forEach(function (mi) {
              miholder.push(mi.replace(/^([0-9]+\-)/g, ''));
            });
            if (j === 0 && k === 0) {
              absoluteMenu[key.replace(/^([0-9]+\-)/g, '')] = miholder.join('/');
            }
            sna.url = miholder.join('/');
            subNav[subnavItem].subnav[k] = sna;
            miholder = [];
          });
        }
      });
    }

    render = swig.compileFile(pageTemplate)({
      'layout': {
        'title': title,
        'content': content.body,
      },
      'main': {
        'title': pageTitle
      },
      'navigation': {
        'main': mainNav,
        'sub': subNav,
        'children': us,
        'active': {
          'main': key ? key.replace(/^([0-9]+\-)/g, '') : '',
          'sub': outputKey ? outputKey : ''
        },
        'next': next,
        'previous': prev
      },
      'resources': content.attributes.resources
    });

    return htmlmin(render, {
      'removeComments': true,
      'collapseWhitespace': true,
      'collapseBooleanAttributes': true,
      'removeRedundantAttributes': true,
      'removeEmptyAttributes': true,
      'removeEmptyElements': true,
      'minifyJS': true,
      'minifyCSS': true,
      'minifyURLs': true
    });
  };

  var outputFile = function outputFile (key, renderKey) {
    var outputKey = [];

    fs.readFile(fin[key][renderKey], 'utf-8', function (err, content) {
      if (err) throw err;

      renderKey.split('/').forEach(function (rk) {
        outputKey.push(rk.replace(/^([0-9]+\-)/g, ''));
      });

      outputKey = outputKey.join('/');

      fs.outputFile(process.cwd() + '/www' + outputKey + '/index.html', contentBuild(content, key, outputKey, renderKey), function (err) {
        if (err) throw err;

        // gutil.log('Wrote ' + gutil.colors.magenta(renderKey.substring(1)) + ' with title ' + gutil.colors.cyan(layout.title.substring(3)));

        delete fin[key][renderKey];

        if (Object.keys(fin[key]).length === 0) {
          delete fin[key];

          if (Object.keys(fin).length === 0) {
            glob(process.cwd() + '/www/**/*.html', function (err, files) {
              var fileCount = files.length,
                  fi;
              files.forEach(function (file) {
                var f = fs.readFileSync(file, 'utf-8');

                Object.keys(absoluteMenu).forEach(function (pth) {
                  var find = 'href="/' + pth + '"',
                      re = new RegExp(find, 'g');

                  f = f.replace(re, 'href="' + absoluteMenu[pth] + '"');
                });

                fs.outputFile(file, f, function (e) {
                  fileCount--;
                  if (fileCount === 0) {
                    end = time.now();

                    gutil.log('Guide rebuilt after ' + gutil.colors.magenta(Math.round((end - start) / 1000) + 'ms'));
                    cb();
                  }
                });
              });
            });
          }
        }
      });
    });
  };
}
