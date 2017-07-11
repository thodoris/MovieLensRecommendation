'use strict';

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

importScripts('../globals.js', './shared/workerShared.js', '../modules/helpers.js', '../modules/siteConfig.js', '../utils/pearsonCorellation.js', '../libs/jsonpack.js', '../libs/lz-string.js');

addEventListener("message", function (e) {
  _parseMessage.apply(undefined, _toConsumableArray(e.data));
}, false);

var _getMoviesSuggestions = function _getMoviesSuggestions(similarUsers, userRatedMovies) {

  var urls = similarUsers.map(function (user) {
    return MOVIEAPP.siteConfig.getApiURL("ratings", "", Number(user.key));
  });
  var min_recommended_movie_rating = MOVIEAPP.siteConfig.config.RECOMMENDATION.min_recommended_movie_rating || 4;
  var max_recommended_movies = MOVIEAPP.siteConfig.config.RECOMMENDATION.max_recommended_movies || 10;
  var excludedMoviesIds = userRatedMovies.map(function (rm) {
    return Number(rm[0]);
  });

  return Promise.all(urls.map(function (url) {
    return _fetch(url);
  })).then(function (responses) {

    //merge responses
    var responsesArray = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = responses[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var response = _step.value;

        responsesArray = responsesArray.concat(response);
      }

      //filter and map
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

    responsesArray = responsesArray.filter(function (x) {
      return x.rating >= min_recommended_movie_rating;
    }) //exclude movies with rating < min_recommended_movie_rating
    .filter(function (x) {
      return !excludedMoviesIds.includes(x.ratingsPK.movieId);
    }) //exclude movies already in user Rated Movies
    .map(function (_ref) {
      var rating = _ref.rating,
          ratingsPK = _ref.ratingsPK;
      return { userId: ratingsPK.userId, movieId: ratingsPK.movieId, rating: rating };
    });

    //group by movieId , and calculate average rating
    var moviesRatingGrouped = responsesArray.reduce(function (r, a) {
      r[a.movieId] = r[a.movieId] || { movieId: a.movieId, "avg": a.rating, "sum": 0 };
      r[a.movieId].sum = r[a.movieId].sum + a.rating;
      r[a.movieId].avg = +((r[a.movieId].avg + a.rating) / 2).toFixed(2);
      return r;
    }, {});

    //convert to Array
    var moviesArray = [];
    Object.keys(moviesRatingGrouped).forEach(function (key) {
      var obj = moviesRatingGrouped[key];
      moviesArray.push(obj);
    });
    //sort by sum , average rating (Descending) and then keep top max_recommended_movies
    var recomendeedMoviesArray = moviesArray.sort(function (obj1, obj2) {
      // Descending sort: first by sum then by avg
      return obj2.sum === obj1.sum ? obj2.avg - obj1.avg : obj2.sum - obj1.sum;
    }).slice(0, max_recommended_movies);

    return {
      "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHSUGGESTIONS),
      "param": JSON.stringify(userRatedMovies),
      "result": Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK),
      "data": recomendeedMoviesArray.slice()
    };
  }).catch(function (error) {

    return {
      "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHSUGGESTIONS),
      "result": Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
      "data": error
    };
  });
}; //end _getMoviesSuggestions


var _getSimilarUsers = function _getSimilarUsers(userRatedMovies) {

  var movieIds = userRatedMovies.map(function (rm) {
    return Number(rm[0]);
  });
  var movieRatings = userRatedMovies.map(function (rm) {
    return Number(rm[1]);
  });

  var url = MOVIEAPP.siteConfig.getApiURL("ratings", "find");
  var data = JSON.stringify({ "movieList": JSON.stringify(movieIds) });

  var min_common_movies = MOVIEAPP.siteConfig.config.RECOMMENDATION.min_common_movies || 2;
  var max_similar_users = MOVIEAPP.siteConfig.config.RECOMMENDATION.max_similar_users || 10;

  var empty_values_correction = MOVIEAPP.siteConfig.config.RECOMMENDATION.empty_values_correction || true;

  var weightedRatings = empty_values_correction ? movieRatings.map(function (x) {
    return -Math.abs(x);
  }) : movieRatings.slice();

  //#hack : deep clone the array to be used in reduce assignment
  var weightedRatings_clone = MOVIEAPP.helpers.deepCloneObject(weightedRatings);

  MOVIEAPP.helpers.log("fetching similar users...");

  //to save network load , we can send only one request , by replacing the parallel code with this line (slower)   
  // return _fetch (url,'post',data).then (responsesArray => {

  //#parallel code START
  var splitted_data = movieIds.map(function (id) {
    return JSON.stringify({ "movieList": "[" + id + "]" });
  });

  return Promise.all(splitted_data.map(function (mid) {
    return _fetch(url, 'post', mid);
  })).then(function (responses) {

    //merge respones  
    var responsesArray = [];
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = responses[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var ratings = _step2.value;

        responsesArray = responsesArray.concat(ratings);
      }
      //#parallel code END
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }

    MOVIEAPP.helpers.log("fetched similar users.");

    //group results by user
    var users_ratings = responsesArray.map(function (_ref2) {
      var rating = _ref2.rating,
          ratingsPK = _ref2.ratingsPK;
      return { userId: ratingsPK.userId, movieId: ratingsPK.movieId, rating: rating };
    }).reduce(function (r, a) {
      r[a.userId] = r[a.userId] || { "count": 0, ratingsarray: [].concat(_toConsumableArray(weightedRatings_clone)) };
      r[a.userId].ratingsarray[movieIds.indexOf(a.movieId)] = a.rating;
      r[a.userId].count = r[a.userId].count + 1;
      return r;
    }, {});

    var usersArray = [];

    //calculate pearsonCorellation for each user
    Object.keys(users_ratings).forEach(function (key) {
      var obj = users_ratings[key];
      if (obj.count >= min_common_movies) {
        var corr = pcorr(movieRatings.slice(), obj.ratingsarray.slice());
        usersArray.push({ key: key, common: obj.count, corr: corr, debug: obj.ratingsarray });
      }
    });

    //sort by correlation 
    var similarUsersArray = usersArray.sort(function (obj1, obj2) {
      // Descending sort: first by correlation then by number of common movies
      return obj2.corr === obj1.corr ? obj2.common - obj1.common : obj2.corr - obj1.corr;
    }).slice(0, max_similar_users);

    MOVIEAPP.helpers.log("similar users calculated:");
    MOVIEAPP.helpers.log(similarUsersArray);
    return similarUsersArray;
  });
}; //end _getSimilarUsers


function _parseMessage(cmd, param1, param2) {
  var replymessage = void 0;

  (function () {
    switch (Symbol.for(cmd)) {

      case MOVIEAPP_CMD_FETCHSUGGESTIONS:

        var userRatedMovies = JSON.parse(param1);

        _getSimilarUsers(userRatedMovies).then(function (users) {
          return _getMoviesSuggestions(users, userRatedMovies);
        }).then(function (msg) {
          _PostMessage(msg);
        }).catch(function (error) {
          replymessage = {
            "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHSUGGESTIONS),
            "param": param1,
            "result": Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
            "data": error
          };
          _PostMessage(replymessage);
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
  })();
} //end _parseMessage