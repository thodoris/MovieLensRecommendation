"use strict";

var MOVIEAPP = MOVIEAPP || {};

MOVIEAPP.movieApiService = function () {

  var getAllMovies = function getAllMovies() {

    var url = MOVIEAPP.siteConfig.getApiURL("movie", "find");
    var data = JSON.stringify({ "keyword": "" });

    var useCache = MOVIEAPP.siteConfig.config.CACHE.caching && MOVIEAPP.siteConfig.config.CACHE.allmovies_cache;
    return MOVIEAPP.cacheService.fetchCache(url, 'post', data, useCache, MOVIEAPP.siteConfig.config.useCompression);
  };

  var findMovies = function findMovies(mkeyword) {

    var url = MOVIEAPP.siteConfig.getApiURL("movie", "find");
    var data = JSON.stringify({ "keyword": mkeyword });

    var useCache = MOVIEAPP.siteConfig.config.CACHE.caching && MOVIEAPP.siteConfig.config.CACHE.suggestions_cache;
    return MOVIEAPP.cacheService.fetchCache(url, 'post', data, useCache, MOVIEAPP.siteConfig.config.useCompression);
  };

  return {
    findMovies: findMovies,
    getAllMovies: getAllMovies
  };
}();