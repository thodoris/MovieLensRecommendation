var MOVIEAPP = MOVIEAPP || {};

MOVIEAPP.movieApiService = (function () {

   var getAllMovies = function () {

    const url = MOVIEAPP.siteConfig.getApiURL("movie", "find");
    const data = JSON.stringify({ "keyword": "" });
    
    const useCache=  (MOVIEAPP.siteConfig.config.CACHE.caching &&  MOVIEAPP.siteConfig.config.CACHE.allmovies_cache);
    return MOVIEAPP.cacheService.fetchCache(url,'post',data,useCache,MOVIEAPP.siteConfig.config.useCompression);

  };

  
  var findMovies = function (mkeyword) {

    const url = MOVIEAPP.siteConfig.getApiURL("movie", "find");
    const data = JSON.stringify({ "keyword": mkeyword });

    const useCache=  (MOVIEAPP.siteConfig.config.CACHE.caching &&  MOVIEAPP.siteConfig.config.CACHE.suggestions_cache);
    return MOVIEAPP.cacheService.fetchCache(url,'post',data,useCache,MOVIEAPP.siteConfig.config.useCompression);

  };

  return {
    findMovies: findMovies,
    getAllMovies:getAllMovies
  };

})();

