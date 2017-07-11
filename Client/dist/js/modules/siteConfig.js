"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var MOVIEAPP = MOVIEAPP || {};

MOVIEAPP.siteConfig = function () {
    // default configuration
    var config = {
        COMPATIBILITY: {
            checkBrowserCompatibility: true,
            compatibleBrowserList: {
                "chrome": {
                    acceptedVersion: 42,
                    downloadUrl: "https://www.google.com/chrome/browser"
                },

                "firefox": {
                    acceptedVersion: 40,
                    downloadUrl: "https://www.mozilla.org/el/firefox/"
                },

                "safari": {
                    acceptedVersion: 5,
                    downloadUrl: "https://support.apple.com/downloads/safari"
                },
                "edge": {
                    acceptedVersion: 14,
                    downloadUrl: "https://www.microsoft.com/en-us/windows/microsoft-edge"
                },
                "ie": {
                    acceptedVersion: 11,
                    downloadUrl: "https://www.microsoft.com/en-us/windows/microsoft-edge"
                }
            }
        },
        API: {
            baseurl: 'http://62.217.127.19:8080/MovielensDbApi/webresources/', //base url of the MovieLens API service
            omdburl: 'http://www.omdbapi.com/', //base url for the Open Movie Database API service
            moviedburl: 'https://api.themoviedb.org/3/', //base url for the MOVIEDB API service
            moviedbkey: '6016c68c0d61a8aea24aa74e0291c235' //MOVIEDB API service key
        },
        UI: {
            movie_card_type: "cardtype1", // The type of the movie card (cardtype1 or cardtype2). Cardtype2 is experimental and works only on webkit browsers
            min_characters_for_autocomplete: 3, //Number of characters the user must type before autocomplete suggestions appear
            max_autocomplete_suggestions: 10, //The maximum number of movie titles displayed in autocomplete
            min_required_movies_ratings: 2, //The minimum number of movies the user must rate in order to get recommendations
            defaultMoviePosterURL: '/images/movie.svg' //The default (fallback) poster for the movie cards
        },
        CACHE: {
            caching: true, //enables or disables caching on global level. If false every other cache parameter is ignored
            allmovies_cache: true, //caches the movies index in localStorage
            allmovies_inmemory_cache: true, //caches the movies index in memory
            suggestions_cache: false, //caches the suggestion results in localStorage (only if allmovies_inmemory_cache is not enabled.)
            metadata_cache: true, //caches the metadata for each movie  in localStorage
            recommendations_cache: false //caches recommendations results  in localStorage
        },
        RECOMMENDATION: {
            empty_values_correction: true, //if true , empty rating on similar user will be corrected
            min_common_movies: 2, //Required number of common movies with a similar user       
            max_similar_users: 10, //Number of similar users to analyze (top corellation)
            max_recommended_movies: 10, //How many recommended movies should be returned to the UI
            min_recommended_movie_rating: 4 //How many movies must be rated in order to get recommendation results
        },
        LOG: {
            logging: true, //enable or disable Logging 
            logging_level: 'debug' //none,error,info,debug
        },
        timeout: 90, //in seconds   
        useCompression: true //if true all data between main thread and web workers will be compressed. Data stored in localStore will be compressed also.
    };

    //get Api Urls
    /**
     * 
     * 
     * @param {string} entitytype
     * @param {string} [method=""]
     * @param {any} [id=null]
     * @returns
     */
    function getApiURL(entitytype) {
        var method = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "";
        var id = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : "";


        switch (entitytype) {
            case 'movie':
            case 'ratings':
                var cMethod = String.isNullOrEmpty(method) && Number.isInteger(id) && id > 0 ? id : method.toLowerCase() + (MOVIEAPP.helpers.capitalize(entitytype) + "s").replace('ss', 's');
                return config.API.baseurl + "entities." + entitytype.toLowerCase() + "/" + cMethod;
                break;
            case 'omdbmeta':
            case 'moviedbmeta':

                return entitytype == 'omdbmeta' ? config.API.omdburl + "?type=movie&plot=short&r=json&i=tt" + id : config.API.moviedburl + "find/tt" + id + "?external_source=imdb_id&language=en-US&api_key=" + config.API.moviedbkey;

                break;

            default:
                break;
        }
    }

    /**
     *  Public method to initialize the siteConfig Module 
     *  if no params are provided , defaults values are used.
     *  A javascript object can be provided to override any (or all) of the default values
     *  e.g:
     *  siteConfig.init({
     *  'API.baseurl': 'http://thodoris.thodoris.net/api',
     *   'CSS.classes.active': 'now',
     *   'timeout': 1000
     *   });
     */
    function init() {
        if (_isObj(arguments[0])) {
            var cfg = arguments[0];
            for (var i in cfg) {
                if (i.indexOf('.') !== -1) {
                    var str = '["' + i.replace(/\./g, '"]["') + '"]';
                    var val = _getValue(cfg[i]);
                    eval('config' + str + '=' + val);
                } else {
                    _setConfig(config, i, cfg[i]);
                }
            }
        }
    };

    function _setConfig(o, p, v) {
        for (var i in o) {
            if (_isObj(o[i])) {
                _setConfig(o[i], p, v);
            } else {
                if (i === p) {
                    o[p] = v;
                };
            }
        }
    };
    function _isObj(o) {
        return (typeof o === "undefined" ? "undefined" : _typeof(o)) === 'object' && typeof o.splice !== 'function';
    };
    function _getValue(v) {
        switch (typeof v === "undefined" ? "undefined" : _typeof(v)) {
            case 'string':
                return "'" + v + "'";
                break;
            case 'number':
            case 'boolean':
                return v;
                break;
            case 'object':
                if (typeof v.splice === 'function') {
                    return '[' + v + ']';
                } else {
                    return '{' + v + '}';
                }
                break;
            case NaN:
                break;
        };
    };

    // export public methods and objects
    return {
        config: config,
        init: init,
        getApiURL: getApiURL
    };
}();