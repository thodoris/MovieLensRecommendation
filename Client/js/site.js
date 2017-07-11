'use strict';

let allMovies;  //Array to keep all the available movies in memory
let moviesloaded = false; //flag to indicate if the movies have been loaded in memory


/**
 * overides the initial configuration values
 */
function loadConfig() {

let startConfig = {
  'UI.movie_card_type':'cardtype2',
  'UI.min_characters_for_autocomplete':3,
  'UI.min_required_movies_ratings':3,
  'CACHE.caching':true,
  'CACHE.allmovies_cache':true,
  'CACHE.metadata_cache':false,
  'RECOMMENDATION.empty_values_correction':true,
  'RECOMMENDATION.min_common_movies':2,
  'RECOMMENDATION.max_similar_users':5,
  'RECOMMENDATION.max_recommended_movies':5,
  'RECOMMENDATION.min_recommended_movie_rating':4,
  'useCompression':true
};

MOVIEAPP.siteConfig.init(startConfig);

}


/**
 * Load all the movies index in memory.
 * 
 * @returns true if loaded , false otherwise
 */
function loadMovies() {

  const useCache = (MOVIEAPP.siteConfig.config.CACHE.caching && MOVIEAPP.siteConfig.config.CACHE.allmovies_inmemory_cache);
  if (!useCache) {
    moviesloaded=false;
    return moviesloaded;
  };
  MOVIEAPP.helpers.logInfo('loading Movies...');
  MOVIEAPP.movieApiService.getAllMovies().then(function (result) {
    allMovies = result;
    moviesloaded = (Array.isArray(allMovies) && allMovies.length > 1);
    MOVIEAPP.helpers.log(moviesloaded?"All movies loaded.":"No movies loaded!");
  })
    .catch(function (error) {
      MOVIEAPP.helpers.logError('Request to get all movies failed', error);
      moviesloaded = false;
    });


    return moviesloaded;
} //end loadMovies



/**
 * Setup the seting UI
 */
function setupSettingsUI(){
  MOVIEAPP.helpers.logInfo('preparing UI...');

  //toggle logging
  let checkLog = document.querySelector('#chkLogging');
  checkLog.checked = MOVIEAPP.siteConfig.config.LOG.logging;
  checkLog.addEventListener('change', function () {
    MOVIEAPP.siteConfig.config.LOG.logging=checkLog.checked;
  });

  // toggle caching 
  let checkCache = document.querySelector('#chkCaching');
  checkCache.checked = MOVIEAPP.siteConfig.config.CACHE.caching;
  checkCache.addEventListener('change', function () {
      MOVIEAPP.siteConfig.config.CACHE.caching = this.checked;
  });

  // toggle compression 
  let checkCompression = document.querySelector('#chkCompression');
  checkCompression.checked =MOVIEAPP.siteConfig.config.useCompression;
  checkCompression.addEventListener('change', function () {
    MOVIEAPP.siteConfig.config.useCompression = this.checked;
  });

  //StorageFreeSpace Settings
  let btn_StorageFreeSpace = document.querySelector('#btn_StorageFreeSpace');
  let label_StorageFreeSpace = document.querySelector('#label_StorageFreeSpace');
  //label_StorageFreeSpace.textContent = MOVIEAPP.cacheService.store.remainingSpace() + " MB";
  // btn_StorageFreeSpace.addEventListener('click', function () {
  //   //label_StorageFreeSpace.textContent = MOVIEAPP.cacheService.store.remainingSpace() + " MB";
  // });

    //StorageClearSettings
  let btn_StorageClear = document.querySelector('#btn_StorageClear');
  btn_StorageClear.addEventListener('click', function () {
     MOVIEAPP.cacheService.store.removeAll();
     //label_StorageFreeSpace.textContent = MOVIEAPP.cacheService.store.remainingSpace() + " MB";
  });


   //range_min_movies_for_recommendation
   let range_min_movies_for_recommendation = document.querySelector('#range_min_movies_for_recommendation');
   let label_range_min_movies_for_recommendation = document.querySelector('#label_range_min_movies_for_recommendation');
   range_min_movies_for_recommendation.value=label_range_min_movies_for_recommendation.textContent = Math.max(MOVIEAPP.siteConfig.config.UI.min_required_movies_ratings || 3,2);;
   range_min_movies_for_recommendation.addEventListener('change', function () {
   label_range_min_movies_for_recommendation.textContent = this.value;
   MOVIEAPP.siteConfig.config.UI.min_required_movies_ratings= this.value;
  });

  //range_max_recommended_movies
   let range_max_autocomplete_suggestions = document.querySelector('#range_max_autocomplete_suggestions');
   let label_range_max_autocomplete_suggestions = document.querySelector('#label_range_max_autocomplete_suggestions');
   range_max_autocomplete_suggestions.value=label_range_max_autocomplete_suggestions.textContent = Math.max(MOVIEAPP.siteConfig.config.UI.max_autocomplete_suggestions || 3 ,2);
   range_max_autocomplete_suggestions.addEventListener('change', function () {
      label_range_max_autocomplete_suggestions.textContent = this.value;
      MOVIEAPP.siteConfig.config.UI.max_autocomplete_suggestions= this.value;
  });

} //end setupUI


function checkCompatibility(){
  const errors=MOVIEAPP.uihelpers.checkBrowserCompatibility();
  if (errors.length>0) {
      document.open();
      document.write("<h1>Your running environment is not supported!</h1>");
      for (let err in errors) {
          document.write("<p>" + errors[err] +"</p>");
      }
      document.close();
     throw new Error("Your running environment is not supported!"); //stop execution
     return false;
  }
 return true;
}

//the entry point of the application
function init() {
  if (!checkCompatibility()) return; //stop execution
  loadMovies();
  loadConfig();
  if (MOVIEAPP.uihelpers.isFirstVisit()) 
    window.location = (""+window.location).replace(/#[A-Za-z0-9_]*$/,'')+"#welcome";
  setupSettingsUI();

  run();
};


//the main function that runs all the recommendation functionality code
function run() {

//Get config values
const timeout= (Math.max(MOVIEAPP.siteConfig.config.timeout||60,40))*1000; //in seconds with default=60 and restrictred minimum=40 

//timers
let executionTimeout =null;

// Get a reference to basic elements (<datalist> & <input>)
let dataList = document.querySelector('#movies-datalist');
let input = document.querySelector('#search-input');
var btnGetRecommendations = document.querySelector('#btnGetRecommendations');
var spinloader = document.querySelector('#spinloader');

// Initialize a simple key/value Map  (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
// movieIds (in key) and number of ratings (in value)
let movieStars = new Map();

//*
//1. Add EVents Listeners for UI
//*
//add EventListener for Get Recommendations button
btnGetRecommendations.addEventListener('click', function (e) {

    const cloned_movieStars = MOVIEAPP.helpers.cloneObject(movieStars);
    const ratedMovies = Array.from(Object.keys(cloned_movieStars).map(x => [x, cloned_movieStars[x]])).filter(([k, v]) => v > 0);
   
    btnGetRecommendations.disabled =true;
    spinloader.style.visibility='visible';
    spinloader.style.display='inline-block';
    
    emptyElement('myRecommendations');
    executionTimeout = setTimeout(() => { 
      btnGetRecommendations.disabled =false;
      spinloader.style.visibility='hidden';
      spinloader.style.display='none';
      executionTimeout=null;
    }, timeout);

     sendMessage([Symbol.keyFor(MOVIEAPP_CMD_FETCHSUGGESTIONS) , JSON.stringify(ratedMovies) ]);

});

//add EventListener for search input
input.addEventListener('input', function () {
  
  const min_characters_for_autocomplete = (Math.max(MOVIEAPP.siteConfig.config.UI.min_characters_for_autocomplete||3,2))  //default 3 and restricred minimum=1
  const keyword = input.value;
  if (keyword.length >= min_characters_for_autocomplete) {

    const existingOptionsList = Array.from(dataList.querySelectorAll('option'));
    const optionSelected = [...existingOptionsList].find(opt => opt.value == keyword)

    if (!(typeof optionSelected==='undefined')) {
       
        input.value='';

        const mid=optionSelected.dataset.value;

        //check if the movie already exists , and if not add it to the user movies
        //const cloned_movieStars=MOVIEAPP.helpers.cloneObject(movieStars);
        if (!(MOVIEAPP.helpers.cloneObject(movieStars)).hasOwnProperty(mid)) {
          addMovieCard({ title: optionSelected.value, movieId: mid }); //add a temporary movieCard with the existing data
          movieStarsObserver[mid]=0; // update of movieStars object fires the actual job
        }
      
      return;
    }

    getSuggestions(this.value).then(result => dataList.innerHTML = result );

  }
  else //length less than min_characters_for_autocomplete
  {
    dataList.innerHTML = '';
  };

}); //end addEventListener

//*
//2. Setup an observer on movieStart and capture changes 
//*

let observer = observe(movieStars, (change) => {

 let changetype=change.type.toUpperCase();
 let id=change.name;
 let oldValue=change.oldValue;
 
 let change_log_str=`MovieStars Object change detected : [${changetype}] , key=${id} , old value=${oldValue}`;
 MOVIEAPP.helpers.log(change_log_str)

 let numRatingsForSuggestion = MOVIEAPP.siteConfig.config.UI.min_required_movies_ratings;
 
 //enable or disable GetRecommendation button
 var cloned_movieStars = MOVIEAPP.helpers.cloneObject(movieStars);
 var ratedMovies = Array.from(Object.keys(cloned_movieStars).map(x => [x, cloned_movieStars[x]])).filter(([k, v]) => v > 0);
 document.querySelector('#btnGetRecommendations').disabled = (executionTimeout!=null || ratedMovies.length<numRatingsForSuggestion);

 switch (changetype) {
  case "ADD":
    
    sendMessage([Symbol.keyFor(MOVIEAPP_CMD_FETCHMOVIEMETA) , id ]);
    
    break;
  case "UPDATE":
     const prefetchRecommendations =  MOVIEAPP.siteConfig.config.UI.prefetch_recommendations;
     if (ratedMovies.length>=numRatingsForSuggestion && prefetchRecommendations) {
        sendMessage([Symbol.keyFor(MOVIEAPP_CMD_FETCHSUGGESTIONS) , JSON.stringify(ratedMovies) ]);
     }
    
  break;
  case "DELETE":
     removeMovieCard(id);
  break;
 }

});

let movieStarsObserver = observer.object;

//*
// 3. setup two web workers to handle movies and recommendations jobs 
//*

var movieWorker = new Worker("js/workers/movieWorker.js");
var recommendationsWorker = new Worker("js/workers/recommendationsWorker.js");

movieWorker.onmessage =  function (e) { handleWorkerMessages(e); };
recommendationsWorker.onmessage =  function (e) { handleWorkerMessages(e); };

function handleWorkerMessages(e) {
        let reply ;
        // check if everything is ok with the e.data
        if (typeof e.data=='undefined') return;

        if(e.data) {

          MOVIEAPP.helpers.log('Message received from worker');
          try {
            if (MOVIEAPP.siteConfig.config.useCompression) {
              reply=MOVIEAPP.helpers.uncompressObject(e.data);
            }
            else
              reply = JSON.parse(e.data);
          } catch(e) {
              console.log('Error parsing data from worker.');
              return;
              }
          }
        
          if (Symbol.for(reply.result)==MOVIEAPP_CMD_RESULT_OK){  

                //cache reply
              if ( MOVIEAPP.cacheService.shouldCache(reply.cmd)) {
                  const val=reply.data
                  const key=JSON.stringify(reply.cmd)+JSON.stringify(reply.param);
                  const alreadyexists =   MOVIEAPP.cacheService.store.has(key);
                  if (!alreadyexists) MOVIEAPP.cacheService.store.set(key,val,MOVIEAPP.siteConfig.config.useCompression);
                  };

          };

        switch (Symbol.for(reply.cmd)) {
        case MOVIEAPP_CMD_FETCHMOVIEMETA:
           MOVIEAPP.helpers.log("processing MOVIEAPP_CMD_FETCHMOVIEMETA reply...");
          if (Symbol.for(reply.result)==MOVIEAPP_CMD_RESULT_OK){
          
            addMovieCard( reply.data , true);
             MOVIEAPP.helpers.log("MOVIEAPP_CMD_FETCHMOVIEMETA processing completed");
          }
          else{
               MOVIEAPP.helpers.log("MOVIEAPP_CMD_FETCHMOVIEMETA failed...");
          }
          
          break;
          case MOVIEAPP_CMD_FETCHSUGGESTIONS:
             MOVIEAPP.helpers.log("processing MOVIEAPP_CMD_FETCHSUGGESTIONS reply...");
            if (Symbol.for(reply.result)==MOVIEAPP_CMD_RESULT_OK){
                const recommendations = reply.data;
                const mids = recommendations.reduce((r, a) => {
                     r.push(a.movieId);
                     return r;
                  }
                  , []);

            
              sendMessage([Symbol.keyFor(MOVIEAPP_CMD_FETCHRECOMMENDEDMOVIESMETA) , mids ]);
               MOVIEAPP.helpers.log("MOVIEAPP_CMD_FETCHSUGGESTIONS processing completed");
            }
            else
            clearRecommendationLoader();

          break;
        case MOVIEAPP_CMD_FETCHRECOMMENDEDMOVIESMETA:
            clearRecommendationLoader();
            if (Symbol.for(reply.result)==MOVIEAPP_CMD_RESULT_OK){
                const recommendations = reply.data;

                  if (typeof recommendations!='undefined' && recommendations!='undefined' && recommendations.length>0) {
                  for (let moviecard of recommendations) {
                    addMovieCard(moviecard , true,true);
                  } ;
                  };

               MOVIEAPP.helpers.log("MOVIEAPP_CMD_FETCHRECOMMENDEDMOVIESMETA processing completed");
            }

          break;

        default:
        
      } //end switch

}; //end movieWorker.onmessage

 movieWorker.onerror= function (e) {
     MOVIEAPP.helpers.logError("Line #" + e.lineno + " - " + e.message + " in " + e.filename);
  }; 

// internal functions inside run() 

const getSuggestions= (keyword) => {
  return new Promise(
    function (resolve, reject) {
      
      const maxMoviesSuggestions = MOVIEAPP.siteConfig.config.UI.max_autocomplete_suggestions;
     
      let autocompleteResults = '';
      if (moviesloaded) {  //get from memory
        allMovies.filter(movie => movie.title.toUpperCase().includes(keyword.toUpperCase()))
          .slice(0, maxMoviesSuggestions)
          .forEach(function (item) {
            autocompleteResults += `<option data-value="${item.movieId}">${item.title}</option>`;
          });
        resolve(autocompleteResults);

      }
      else {  //get from movieApiService
        MOVIEAPP.movieApiService.findMovies(keyword.toUpperCase())
          .then(movies => {
            movies.slice(0, maxMoviesSuggestions).forEach(function (item) {
              autocompleteResults += `<option data-value="${item.movieId}">${item.title}</option>`;
            });
            resolve(autocompleteResults);
          })
          .catch(error => { reject(error); });
      }
    });

} //end getSuggestions

        const emptyElement = (id) => {
          let myNode =  document.querySelector('#'+id);
          while(myNode.hasChildNodes())
            {
              myNode.removeChild(myNode.lastChild);
            }
        };

        const clearRecommendationLoader = () => {
            spinloader.style.visibility='hidden';
             spinloader.style.display='none';
             btnGetRecommendations.disabled =false;
             clearTimeout(executionTimeout);
             executionTimeout=null;
        };

        const removeMovieCard = (id) => {
          let current_card =  document.querySelector('#user_movie_'+id);
          const parentNode= current_card.parentNode;
          parentNode.removeChild(current_card);
        }

        const  addMovieCard = (movieMeta , fullRender=false,isRecommendation=false)  => {
        
        const DOMContainer=isRecommendation?"#myRecommendations":"#myMovies";
        const movie_card_type = MOVIEAPP.siteConfig.config.UI.movie_card_type;
        const new_card_html = (movie_card_type=="cardtype2")? addedMovie2({ fullRender: fullRender, movie: movieMeta , allowRating:!isRecommendation }).trim():addedMovie({ fullRender: fullRender, movie: movieMeta , allowRating:!isRecommendation }).trim();

        const new_card = MOVIEAPP.uihelpers.htmlToElement(new_card_html);
        const parentNode = document.querySelector(DOMContainer);

        if (!isRecommendation && fullRender) {
          
            const current_card_id=`#user_movie_${movieMeta.movieId}`;
            const current_card =  document.querySelector(current_card_id);

            parentNode.replaceChild(new_card, current_card);
            MOVIEAPP.uihelpers.addAnimation(new_card.children[0], "fadeIn"); //replace card animation

        } else
        {
          parentNode.appendChild(new_card);
        }

      if (isRecommendation) return;

      let new_card_stars = new_card.querySelectorAll('.rating input');
      let new_card_close_button = new_card.querySelector('.close');

      new_card_close_button.addEventListener('click', function(event) {
        const element= event.target;
        const movieId = element.dataset.movieid;
        
        delete movieStarsObserver[movieId];
      });

      Array.from(new_card_stars).forEach(link => {
          link.addEventListener('change', function(event) {
          
          const element= event.target;
          const movieId = element.dataset.movieid;
          const rating =  parseInt(element.value);  
          if (element.checked)  movieStarsObserver[movieId] = rating;

          });
      });

      } //end addMovieCard

  const sendMessage = (msg) => {

          const cmd=msg[0];
          const param=msg[1];
          const key=JSON.stringify(cmd)+JSON.stringify(param);

          const useCache = MOVIEAPP.cacheService.shouldCache(cmd);
          const existsInCache =   MOVIEAPP.cacheService.store.has(key);

          if (useCache && existsInCache) {
            let eventdata=null;
            const cacheddata =   MOVIEAPP.cacheService.store.get(key);
            const  replymessage= {
              "cmd": Symbol.keyFor(Symbol.for(cmd)),
              "param" : param,
              "result":Symbol.keyFor(MOVIEAPP_CMD_RESULT_OK),
              "data":cacheddata
            }; 

              if (MOVIEAPP.siteConfig.config.useCompression)
                eventdata= MOVIEAPP.helpers.compressObject(replymessage);
              else
              eventdata = JSON.stringify(replymessage)
           
            let event = new MessageEvent('message', {'data':  eventdata });
            recommendationsWorker.dispatchEvent(event)
          } 
          else  //no cache , forward the message to Web Worker
          {
            if (Symbol.for(cmd)==MOVIEAPP_CMD_FETCHSUGGESTIONS)
            recommendationsWorker.postMessage(msg);
            else
            movieWorker.postMessage(msg);
          }

        };



} //end run()

init(); //one line to rule them all