importScripts('../globals.js' ,'./shared/workerShared.js', '../modules/helpers.js','../modules/siteConfig.js','../utils/pearsonCorellation.js', '../libs/jsonpack.js','../libs/lz-string.js'); 

addEventListener("message", function (e) {
 _parseMessage(...e.data)
}, false);


var _getMoviesSuggestions = function (similarUsers,userRatedMovies) {

     let urls=similarUsers.map(user=>MOVIEAPP.siteConfig.getApiURL("ratings","",Number(user.key)));
     const min_recommended_movie_rating   =  MOVIEAPP.siteConfig.config.RECOMMENDATION.min_recommended_movie_rating || 4;
     const max_recommended_movies = MOVIEAPP.siteConfig.config.RECOMMENDATION.max_recommended_movies || 10;
     const excludedMoviesIds = userRatedMovies.map(rm => Number(rm[0]));
    
    return Promise.all(urls.map(url=> {return _fetch(url);}))
    .then(responses => {

      //merge responses
      let responsesArray=[];
      for (let response of responses) {
         responsesArray=responsesArray.concat(response);
      } 
     
     //filter and map
     responsesArray=responsesArray
     .filter(x=> x.rating>= min_recommended_movie_rating) //exclude movies with rating < min_recommended_movie_rating
     .filter(x=> !excludedMoviesIds.includes(x.ratingsPK.movieId)) //exclude movies already in user Rated Movies
     .map(({rating, ratingsPK}) => ({userId: ratingsPK.userId , movieId:ratingsPK.movieId , rating}));
         
      //group by movieId , and calculate average rating
       let moviesRatingGrouped=responsesArray.reduce( (r, a) => {
                      r[a.movieId] = r[a.movieId] || {movieId:a.movieId,"avg":a.rating ,"sum":0};
                      r[a.movieId].sum = (r[a.movieId].sum)+a.rating;
                      r[a.movieId].avg =  +(((r[a.movieId].avg)+a.rating)/2).toFixed(2);
                      return r;
                  }
                  , {});

       //convert to Array
       let moviesArray=[];
       Object.keys(moviesRatingGrouped).forEach(function (key) {
                      let obj = moviesRatingGrouped[key];
                      moviesArray.push(obj);
                      
                    });
      //sort by sum , average rating (Descending) and then keep top max_recommended_movies
      let recomendeedMoviesArray= moviesArray.sort((obj1, obj2)=> {
                // Descending sort: first by sum then by avg
                return obj2.sum === obj1.sum ? obj2.avg - obj1.avg : obj2.sum - obj1.sum;
       }).slice(0, max_recommended_movies);

       return {
          "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHSUGGESTIONS),
          "param":JSON.stringify(userRatedMovies),
          "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK),
          "data":recomendeedMoviesArray.slice()
        }; 

    })
    .catch(error => {

        return {
          "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHSUGGESTIONS),
          "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
          "data":error
        }; 
    }); 

}; //end _getMoviesSuggestions


var _getSimilarUsers = function (userRatedMovies) {


      const movieIds = userRatedMovies.map(rm => Number(rm[0]));
      const movieRatings = userRatedMovies.map(rm => Number(rm[1]));

      const url=MOVIEAPP.siteConfig.getApiURL("ratings","find");
      const data =  JSON.stringify({"movieList":JSON.stringify(movieIds)});

      const min_common_movies   =  MOVIEAPP.siteConfig.config.RECOMMENDATION.min_common_movies || 2;
      const max_similar_users   =   MOVIEAPP.siteConfig.config.RECOMMENDATION.max_similar_users || 10;
   
      const empty_values_correction = MOVIEAPP.siteConfig.config.RECOMMENDATION.empty_values_correction || true;

      let weightedRatings = empty_values_correction? movieRatings.map(x=> -Math.abs(x)):movieRatings.slice();

      //#hack : deep clone the array to be used in reduce assignment
      const weightedRatings_clone = MOVIEAPP.helpers.deepCloneObject(weightedRatings);
      
      MOVIEAPP.helpers.log("fetching similar users...");


        //to save network load , we can send only one request , by replacing the parallel code with this line (slower)   
        // return _fetch (url,'post',data).then (responsesArray => {
        
        //#parallel code START
        const splitted_data = movieIds.map(id=>JSON.stringify({"movieList":"["+id+"]"}));

         return Promise.all(splitted_data.map(mid=> {return _fetch(url,'post',mid);}))
        .then(responses => {

          //merge respones  
          let responsesArray=[];
          for (let ratings of responses) {
            responsesArray=responsesArray.concat(ratings);
          } 
         //#parallel code END
      
          MOVIEAPP.helpers.log("fetched similar users.");
                
                //group results by user
                 let users_ratings=responsesArray
                .map(({rating, ratingsPK}) => ({userId: ratingsPK.userId , movieId:ratingsPK.movieId , rating}))
                .reduce( (r, a) => {
                      r[a.userId] = r[a.userId] ||  {"count":0 , ratingsarray:[...weightedRatings_clone]};
                      r[a.userId].ratingsarray[movieIds.indexOf(a.movieId)]=a.rating;
                      r[a.userId].count =  (r[a.userId].count)+1;
                      return r;
                  }
                  , {});
                
               
                  let usersArray=[];

                  //calculate pearsonCorellation for each user
                  Object.keys(users_ratings).forEach(function (key) {
                      let obj = users_ratings[key];
                      if (obj.count>= min_common_movies) {
                          let corr = pcorr(movieRatings.slice(), obj.ratingsarray.slice());
                          usersArray.push({key,common:obj.count,corr , debug:obj.ratingsarray});
                      }
                   
                    });

                //sort by correlation 
                let similarUsersArray= usersArray.sort((obj1, obj2)=> {
                // Descending sort: first by correlation then by number of common movies
                return obj2.corr === obj1.corr ? obj2.common - obj1.common : obj2.corr - obj1.corr;
              
              }).slice(0, max_similar_users);
              
              MOVIEAPP.helpers.log("similar users calculated:");
              MOVIEAPP.helpers.log(similarUsersArray);
              return similarUsersArray;

      });


}; //end _getSimilarUsers


function _parseMessage(cmd,param1,param2)
{
 let replymessage;

switch (Symbol.for(cmd)) {

    case MOVIEAPP_CMD_FETCHSUGGESTIONS:
        
        const userRatedMovies = JSON.parse(param1);

        _getSimilarUsers(userRatedMovies)
         .then(users => {
           return _getMoviesSuggestions(users,userRatedMovies);
         })
         .then(msg => {
              _PostMessage(msg);
           })
        .catch(error => {
            replymessage= {
              "cmd": Symbol.keyFor(MOVIEAPP_CMD_FETCHSUGGESTIONS),
              "param":param1,
              "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_FAILED),
              "data":error
            }; 
           _PostMessage(replymessage);
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