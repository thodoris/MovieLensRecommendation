'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

importScripts('../globals.js', './shared/workerShared.js', '../modules/helpers.js', '../modules/siteConfig.js', '../data/movies.map.js', '../libs/jsonpack.js', '../libs/lz-string.js');

addEventListener("message", function (e) {
  _parseMessage.apply(undefined, _toConsumableArray(e.data));
}, false);

var _getMoviesMeta = function _getMoviesMeta(moviesIds, metaprovider) {

  var urls = moviesIds.map(function (mid) {
    return MOVIEAPP.siteConfig.getApiURL(metaprovider, "get", moviesMap.get(mid.toString()));
  });

  return Promise.all(urls.map(function (x) {
    return _fetch(x);
  })).then(function (responses) {

    return Promise.all(responses.map(function (response) {
      return _checkMovieMeta(response, metaprovider);
    }));
  }).then(function (responses) {

    //merge responses
    var moviesMetaArray = [];

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = responses.entries()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var _step$value = _slicedToArray(_step.value, 2),
            index = _step$value[0],
            value = _step$value[1];

        value.movieId = index;
        moviesMetaArray.push(value);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    ; //end for

    return {
      "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHRECOMMENDEDMOVIESMETA),
      "param": moviesIds,
      "result": Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK),
      "data": moviesMetaArray
    };
  }).catch(function (error) {
    MOVIEAPP.helpers.logError(error);
    return {
      "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHRECOMMENDEDMOVIESMETA),
      "param": moviesIds,
      "result": Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
      "data": error
    };
  });
}; //end _getMoviesMeta

var _getMovieMeta = function _getMovieMeta(movieId, metaprovider) {

  var imdbid = moviesMap.get(movieId);
  var url = MOVIEAPP.siteConfig.getApiURL(metaprovider, "get", imdbid);

  return _fetch(url).then(function (moviemeta) {
    //moviemeta.Poster='http://12.2.2.2';

    return _checkMovieMeta(moviemeta, metaprovider);
  }).then(function (moviemeta) {

    moviemeta.movieId = movieId;
    moviemeta.imdbId = imdbid;

    return {
      "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHMOVIEMETA),
      "param": movieId,
      "result": Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK),
      "data": moviemeta
    };
  }).catch(function (error) {
    MOVIEAPP.helpers.logError(error);
    return {
      "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHMOVIEMETA),
      "param": movieId,
      "result": Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
      "data": error
    };
  });
}; //end _getMovieMeta

var _checkMovieMeta = function _checkMovieMeta(moviemeta, metaprovider) {
  return new Promise(function (resolve, reject) {
    if (metaprovider == 'omdbmeta') {

      if (typeof moviemeta == 'undefined') reject('No metadata found for movie');
      if (typeof moviemeta.Response == 'undefined' || moviemeta.Response.toUpperCase() != "TRUE") reject('No response in Metadata');

      if (typeof moviemeta.Poster == 'undefined') moviemeta.Poster = MOVIEAPP.siteConfig.config.UI.defaultMoviePosterURL;
      if (moviemeta.imdbID != 'undefined' && moviemeta.imdbID.length > 2) moviemeta.imdbID = moviemeta.imdbID.replace('tt', '');
      var resolvedmeta = { "imdbId": moviemeta.imdbID, "title": moviemeta.Title, "year": moviemeta.Year, "plot": moviemeta.Plot, "genres": moviemeta.Genre, "poster": moviemeta.Poster };
      resolve(resolvedmeta);
    } else if (metaprovider == 'moviedbmeta') {
      if (typeof moviemeta == 'undefined') reject('No metadata found for movie');
      if (typeof moviemeta.movie_results == 'undefined' || moviemeta.movie_results.length < 1) reject('No response in Metadata');

      var result = moviemeta.movie_results[0];

      if (typeof result.poster_path == 'undefined') result.poster_path = MOVIEAPP.siteConfig.config.UI.defaultMoviePosterURL;else result.poster_path = 'https://image.tmdb.org/t/p/w342' + result.poster_path;

      var _resolvedmeta = { "imdbId": 0, "title": result.title, "year": result.release_date, "plot": result.overview, "genres": '', "poster": result.poster_path };
      resolve(_resolvedmeta);
    } else {
      reject('Wrong metadata provider!');
    };
  });
};

function _parseMessage(cmd, param1, param2) {
  var replymessage = void 0;

  switch (Symbol.for(cmd)) {
    case MOVIEAPP_CMD_FETCHRECOMMENDEDMOVIESMETA:

      //first try using omdb api
      _getMoviesMeta(param1, 'omdbmeta').then(function (msg) {
        if (msg.result != Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK)) {
          //retry using moviedb api
          _getMoviesMeta(param1, 'moviedbmeta').then(function (msg) {
            _PostMessage(msg);
          });
        } else _PostMessage(msg);
      });

      break;

      break;
    case MOVIEAPP_CMD_FETCHMOVIEMETA:

      if (!moviesMap.has(param1)) {
        replymessage = {
          "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHMOVIEMETA),
          "param": "null",
          "result": Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
          "data": "We dont know the IMDB id for this movie!" };
        _PostMessage(replymessage);
        break;
      }

      //first try using omdb api
      _getMovieMeta(param1, 'omdbmeta').then(function (msg) {
        if (msg.result != Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK)) {
          //retry using moviedb api
          _getMovieMeta(param1, 'moviedbmeta').then(function (msg) {
            _PostMessage(msg);
          });
        } else _PostMessage(msg);
      });

      break;

    default:
      replymessage = {
        "cmd": Symbol.keyFor(MOVIEAPP_CMD_UNKNOWN),
        "param": param1,
        "result": Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
        "data": "Unknown command received" };
      _PostMessage(replymessage);
      break;

  } //end switch
} //end _parseMessage