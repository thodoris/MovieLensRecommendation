importScripts('../globals.js' , './shared/workerShared.js','../modules/helpers.js','../modules/siteConfig.js','../data/movies.map.js','../libs/jsonpack.js','../libs/lz-string.js'); 

addEventListener("message", function (e) {
 _parseMessage(...e.data)
}, false);

var _getMoviesMeta = function(moviesIds , metaprovider) {

    const urls=moviesIds.map(mid => MOVIEAPP.siteConfig.getApiURL(metaprovider,"get",moviesMap.get(mid.toString())));

    return Promise.all(urls.map(x=> {return _fetch(x);}))
    .then(responses => {
                
         return Promise.all(responses.map(response=> {return _checkMovieMeta(response,metaprovider);}))
         
    })
    .then(responses => {

           //merge responses
           let moviesMetaArray = [];
           
           for (let [index, value] of responses.entries()) {
             value.movieId = index;
             moviesMetaArray.push(value);
           };//end for

        return {
          "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHRECOMMENDEDMOVIESMETA),
          "param":moviesIds,
          "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK),
          "data":moviesMetaArray
        };
    })
    .catch(error => {
     MOVIEAPP.helpers.logError(error);
     return {
          "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHRECOMMENDEDMOVIESMETA),
          "param":moviesIds,
          "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
          "data":error
        }; 
        
    });

}; //end _getMoviesMeta

var _getMovieMeta = function (movieId , metaprovider) {

    const imdbid=moviesMap.get(movieId);
    const url=MOVIEAPP.siteConfig.getApiURL(metaprovider,"get",imdbid);

    return _fetch (url)
    .then (moviemeta => {
     //moviemeta.Poster='http://12.2.2.2';

     return _checkMovieMeta(moviemeta,metaprovider);

    })
    .then(moviemeta => {
        
        moviemeta.movieId=movieId;
        moviemeta.imdbId=imdbid;

        return {
          "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHMOVIEMETA),
          "param" : movieId,
          "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK),
          "data":moviemeta
        };
       
    })
    .catch(error => {
     MOVIEAPP.helpers.logError(error);
     return {
          "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHMOVIEMETA),
           "param" : movieId,
          "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
          "data":error
        }; 
        
    });

} //end _getMovieMeta

var _checkMovieMeta = function(moviemeta , metaprovider){
      return new Promise(
        function (resolve,reject) {
          if (metaprovider == 'omdbmeta') {

            if (typeof moviemeta == 'undefined') reject('No metadata found for movie');
            if (typeof moviemeta.Response == 'undefined' || moviemeta.Response.toUpperCase() != "TRUE") reject('No response in Metadata');

            if (typeof moviemeta.Poster == 'undefined') moviemeta.Poster = MOVIEAPP.siteConfig.config.UI.defaultMoviePosterURL;
            if (moviemeta.imdbID != 'undefined' && moviemeta.imdbID.length>2 ) moviemeta.imdbID=moviemeta.imdbID.replace('tt','');
            const resolvedmeta = { "imdbId":moviemeta.imdbID, "title": moviemeta.Title, "year": moviemeta.Year, "plot": moviemeta.Plot, "genres": moviemeta.Genre, "poster": moviemeta.Poster }
            resolve(resolvedmeta);
          }
          else if (metaprovider == 'moviedbmeta') {
            if (typeof moviemeta == 'undefined') reject('No metadata found for movie');
            if (typeof moviemeta.movie_results == 'undefined' || moviemeta.movie_results.length < 1) reject('No response in Metadata');

            let result = moviemeta.movie_results[0];

            if (typeof result.poster_path == 'undefined') result.poster_path = MOVIEAPP.siteConfig.config.UI.defaultMoviePosterURL
            else result.poster_path = `https://image.tmdb.org/t/p/w342${result.poster_path}`;

            const resolvedmeta = { "imdbId":0,"title": result.title, "year": result.release_date, "plot": result.overview, "genres": '', "poster": result.poster_path };
            resolve(resolvedmeta);
          }
          else {
            reject('Wrong metadata provider!');
          };
          });
};

function _parseMessage(cmd,param1,param2)
{
 let replymessage;

switch (Symbol.for(cmd)) {
  case MOVIEAPP_CMD_FETCHRECOMMENDEDMOVIESMETA:

    //first try using omdb api
    _getMoviesMeta(param1, 'omdbmeta')
      .then(msg => {
        if (msg.result != Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK)) {
          //retry using moviedb api
          _getMoviesMeta(param1, 'moviedbmeta').then(msg => {
            _PostMessage(msg);
          });
        }
        else
        _PostMessage(msg);
      });

    break;

  break;
  case MOVIEAPP_CMD_FETCHMOVIEMETA:
  
      if (!moviesMap.has(param1))
      {
        replymessage={
              "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHMOVIEMETA),
              "param":"null",
              "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
              "data":"We dont know the IMDB id for this movie!"};
        _PostMessage(replymessage);
        break;
      }

      //first try using omdb api
      _getMovieMeta(param1,'omdbmeta')
      .then(msg => {
          if (msg.result!=Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK)) 
          {
              //retry using moviedb api
               _getMovieMeta(param1,'moviedbmeta').then(msg => {
                      _PostMessage(msg);
              });
          }
          else
          _PostMessage(msg);
      });

    break;
    
  default:
   replymessage={
          "cmd": Symbol.keyFor(MOVIEAPP_CMD_UNKNOWN),
           "param":param1,
          "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
          "data":"Unknown command received"};
  _PostMessage(replymessage);
  break;
    
} //end switch

} //end _parseMessage