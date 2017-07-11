'use strict';

var MOVIEAPP = MOVIEAPP || {};

MOVIEAPP.cacheService = function () {
  var config = {
    prefix: 'MOVIEAPP_',
    compressed_prefix: 'COMPRESSED',
    ttl: 12 };
  var _outOfSpace = false;

  var _hashstr = function _hashstr(s) {
    var hash = 0;
    if (s.length == 0) return hash;
    for (var i = 0; i < s.length; i++) {
      var char = s.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };

  var _ErrorEventisOutOfSpace = function _ErrorEventisOutOfSpace(e) {
    if (e && e.name === 'QUOTA_EXCEEDED_ERR' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.name === 'QuotaExceededError') {
      return true;
    }
    return false;
  };

  var _generateKey = function _generateKey(k, compressed) {
    return (compressed ? config.compressed_prefix : '') + config.prefix + _hashstr(k);
  };

  var localstore = {
    s: window.localStorage,
    type: 'localStorage',
    set: function set(key, val) {
      var compress = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;


      if (typeof val === 'undefined' || val === 'undefined' || val === null || val === '' || val.length == 0) return false;

      var genkey = _generateKey(key, compress);
      var store_value = null;

      if (compress) {
        store_value = MOVIEAPP.helpers.compressObject(val);
      } else {
        store_value = JSON.stringify(val);
      };

      try {
        this.s.setItem(genkey, store_value);
        this.s.setItem(genkey + 'cachettl', +new Date() + 1000 * 60 * 60 * config.ttl);
        return val;
      } catch (e) {
        // If we hit the limit, and we don't have an empty localStorage then it means we are out of space
        if (_ErrorEventisOutOfSpace(e) && localStorage.length) {
          _outOfSpace = true;
          return false;
        } else {
          return false;
        }
      }
    },
    get: function get(key) {

      var genkey = _generateKey(key);
      var genkey_compressed = _generateKey(key, true);

      var ttl = this.s.getItem(genkey + 'cachettl');
      if (ttl && ttl < +new Date()) {
        this.remove(key);
        return undefined;
      };

      if (this.s.hasOwnProperty(genkey)) {

        var value = this.s.getItem(genkey);
        if (typeof value != 'string') {
          return undefined;
        };
        try {
          return JSON.parse(value);
        } catch (e) {
          return value || undefined;
        };
      } else if (this.s.hasOwnProperty(genkey_compressed)) {
        var _value = this.s.getItem(genkey_compressed);
        if (typeof _value != 'string') {
          return undefined;
        };
        try {
          return MOVIEAPP.helpers.uncompressObject(_value);
        } catch (e) {
          return undefined;
        };
      } else return undefined;
    },
    remove: function remove(key) {
      var genkey = _generateKey(key);
      var genkey_compressed = _generateKey(key, true);
      this.s.removeItem(genkey);
      this.s.removeItem(genkey + 'cachettl');
      this.s.removeItem(genkey_compressed);
      this.s.removeItem(genkey_compressed + 'cachettl');
    },
    removeAll: function removeAll() {
      this.s.clear();
    },
    has: function has(key) {
      var genkey = _generateKey(key);
      var genkey_compressed = _generateKey(key, true);
      return this.s.hasOwnProperty(genkey) || this.s.hasOwnProperty(genkey_compressed);
    },
    isSupported: function isSupported() {
      var hasCachedStorage = false;
      var key = '__tempcachetest__';
      var value = key;

      try {
        if (!localStorage) {
          return false;
        }
      } catch (ex) {
        return false;
      }

      try {
        this.s.setItem(key, value);
        this.s.removeItem(key);
        hasCachedStorage = true;
      } catch (e) {
        // If we hit the limit, and we don't have an empty localStorage then it means we have support
        if (_ErrorEventisOutOfSpace(e) && localStorage.length) {
          hasCachedStorage = true; // just maxed it out and even the set test failed.
        } else {
          hasCachedStorage = false;
        }
      }
      return hasCachedStorage;
    },
    remainingSpace: function remainingSpace() {
      //in MB
      var allocated = 5;
      var inUse = 0;
      for (var i = 0; i <= this.s.length - 1; i++) {
        key = localStorage.key(i);
        inUse += this.s.getItem(key).length * 2; //Value is multiplied by 2 due to data being stored in `utf-16` format, w
      }
      var remaining = allocated - inUse / 1024 / 1024;
      return remaining.toFixed(2);
    }
  };

  var useCacheForCommand = function useCacheForCommand(cmd) {
    //cache reply
    var globalCache = MOVIEAPP.siteConfig.config.CACHE.caching;
    if (!globalCache) return false;

    var metadataCache = globalCache && MOVIEAPP.siteConfig.config.CACHE.metadata_cache;
    var recommendationsCache = globalCache && MOVIEAPP.siteConfig.config.CACHE.recommendations_cache;

    var useCache = Symbol.for(cmd) == MOVIEAPP_CMD_FETCHSUGGESTIONS && recommendationsCache || Symbol.for(cmd) != MOVIEAPP_CMD_FETCHSUGGESTIONS && metadataCache;

    return useCache;
  };

  /**
   *
   * modified fetch to allow caching of response in localStorage
   * 
   * USAGE:
   * 
   * _fetch('url', {
   *      method: 'get',
   *      data : null,
   *      useCache : false
   *  }).then(function(response){
   *      // The response is available here.
   *  });
   */

  var _fetch = function _fetch(url) {
    var method = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'get';
    var data = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var useCache = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
    var useCompression = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : true;


    //get from cache
    if (useCache) {
      var _key = JSON.stringify(url) + JSON.stringify(method) + JSON.stringify(data);
      var existsInCache = localstore.has(_key);
      if (existsInCache) {
        var cachedResponse = localstore.get(_key);
        return Promise.resolve(cachedResponse);
      }
    };

    var methodHeaders = new Headers();
    if (method == 'post') {
      methodHeaders.append('Accept', 'application/json');
      methodHeaders.append('Content-Type', 'application/json');
      methodHeaders.append('Origin', '*');
    }

    //  let methodHeaders = (method=='post')? {
    //     'Accept': 'application/json',
    //     'Content-Type': 'application/json',
    //     'Origin': null
    //   }:{};

    //    var methodHeaders = method == 'post' ? new Headers({
    //   'Accept': 'application/json',
    //   'Content-Type': 'application/json',
    //   'Origin': ''
    // }) : new Headers({});

    return fetch(url, {
      method: method,
      mode: 'cors',
      headers: methodHeaders,
      body: data
    }).then(function (response) {
      //check response
      if (response.ok && response.status >= 200 && response.status < 300) {
        return response;
      } else {
        var error = new Error(response.statusText);
        error.response = response;
        return Promise.reject(error);
      };
    }).then(function (response) {
      //return json

      return response.json().then(function (jsonResponseData) {

        if (useCache) {
          //save in cache if not exists
          var _key2 = JSON.stringify(url) + JSON.stringify(method) + JSON.stringify(data);
          var _existsInCache = localstore.has(_key2);
          if (!_existsInCache) localstore.set(_key2, jsonResponseData, useCompression);
        };
        return Promise.resolve(jsonResponseData);
      });
    }).catch(function (error) {
      MOVIEAPP.helpers.logError('Request failed', error);
      return Promise.reject(error);
    });
  }; //end _fetch

  return {
    store: localstore,
    shouldCache: useCacheForCommand,
    fetchCache: _fetch
  };
}();