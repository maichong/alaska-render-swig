/**
 * @copyright Maichong Software Ltd. 2016 http://maichong.it
 * @date 2016-04-13
 * @author Liang <liang@maichong.it>
 */

'use strict';

const Swig = require('swig').Swig;
const path = require('path');
const fs = require('fs');
const alaska = require('alaska');
const _ = require('lodash');

module.exports = function (service, options) {
  options = options || {};
  let map = {};

  function createMap() {
    map = {};
    service._templatesDirs.forEach(dir => {
      map = _.defaultsDeep({}, readDir(dir), map);
    });

    map = objectToMap(map);
  }

  createMap();

  let DEV = process.env.NODE_ENV !== 'production';

  if (DEV) {
    options.cache = false;
  }

  options.loader = {
    resolve: function (to, from) {
      if (to[0] === '/' || !from) {
        return to;
      }
      if (map[from]) {
        return path.join(from, '..', to);
      }
      return path.join(from, to);
    },
    load: function (identifier, cb) {
      if (DEV) {
        createMap();
      }
      let file = map[identifier];
      if (!file) {
        file = map[identifier + '.swig'];
      }
      if (!file) {
        alaska.panic(`Template file ${service.id}:${identifier} is not exists!`);
      }
      if (!cb) {
        return fs.readFileSync(file, 'utf8');
      }
      fs.readFile(file, 'utf8', cb);
    }
  };
  return new Swig(options);
};

function readDir(dir) {
  let map = {};
  try {
    let files = fs.readdirSync(dir);
    for (let name of files) {
      if (name[0] === '.') {
        delete files[name];
        continue;
      }
      map[name] = dir + '/' + name;
      if (alaska.util.isDirectory(map[name])) {
        map[name] = readDir(map[name]);
      }
    }
  } catch (err) {
  }
  return map;
}

function objectToMap(obj, path, map) {
  path = path ? path + '/' : '';
  map = map || {};
  for (let key in obj) {
    let p = path + key;
    let value = obj[key];
    if (typeof value === 'object') {
      objectToMap(value, p, map);
    } else {
      map[p] = value;
    }
  }
  return map;
}
