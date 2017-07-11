var MOVIEAPP  = MOVIEAPP || {};

MOVIEAPP.cacheService = (function () {
  const config =
  {
    prefix:'MOVIEAPP_',
    compressed_prefix:'COMPRESSED',
    ttl:12,   //in hours
  };
  let _outOfSpace=false;

  const _hashstr = (s) => {
    let hash = 0;
    if (s.length == 0) return hash;
    for (let i = 0; i < s.length; i++) {
      let char = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  };


  const _ErrorEventisOutOfSpace = (e) => {
    if (e && e.name === 'QUOTA_EXCEEDED_ERR' ||
            e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
            e.name === 'QuotaExceededError') {
        return true;
    }
    return false;
  };

const _generateKey = (k,compressed) =>  (compressed?config.compressed_prefix:'')+config.prefix + _hashstr(k);

const localstore = {
  s: window.localStorage,
  type: 'localStorage',
  set: function(key, val , compress=false) {
  
  if (typeof val==='undefined' || val==='undefined' ||  val===null || val==='' || val.length==0) return false;

  let genkey = _generateKey(key,compress);
  let store_value=null;
  
  if (compress) {
      store_value = MOVIEAPP.helpers.compressObject(val);
  }
  else {
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
  get: function(key) {
    
   let genkey= _generateKey(key);
   let genkey_compressed=_generateKey(key,true);
   
   let ttl =  this.s.getItem(genkey + 'cachettl');
   if (ttl && ttl < +new Date()) {
     this.remove(key);
     return undefined;
    };

    if (this.s.hasOwnProperty(genkey)) {

      let value = this.s.getItem(genkey);
      if (typeof value != 'string') { return undefined };
      try {
        return JSON.parse(value)
      }
      catch (e) {
        return value || undefined
      };

    }
    else if (this.s.hasOwnProperty(genkey_compressed)) {
       let value = this.s.getItem(genkey_compressed);
      if (typeof value != 'string') { return undefined };
      try {
        return  MOVIEAPP.helpers.uncompressObject(value);
      }
      catch (e) {
        return undefined;
      };
    }
    else
    return undefined;
   
  },
  remove: function(key) { 
    let genkey= _generateKey(key);
    let genkey_compressed=_generateKey(key,true);
    this.s.removeItem(genkey);
    this.s.removeItem(genkey+'cachettl');
    this.s.removeItem(genkey_compressed);
    this.s.removeItem(genkey_compressed+'cachettl');
  },
  removeAll: function() { this.s.clear(); },
  has : function(key) {
        let genkey= _generateKey(key);
        let genkey_compressed=_generateKey(key,true);
        return (this.s.hasOwnProperty(genkey) || this.s.hasOwnProperty(genkey_compressed) ) ; 
  },
  isSupported: function() {
    let hasCachedStorage=false;
    const key= '__tempcachetest__';
    const value = key;

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
  remainingSpace: function () {  //in MB
    const allocated = 5;
    let inUse = 0;
		for (let i=0; i<=this.s.length-1; i++)  
		{  
			key = localStorage.key(i);  
      inUse += this.s.getItem(key).length*2;  //Value is multiplied by 2 due to data being stored in `utf-16` format, w
		}  
const remaining = allocated - (inUse/  1024 / 1024);
    return remaining.toFixed(2);
  }
};

const useCacheForCommand = cmd => {
        //cache reply
         const globalCache = (MOVIEAPP.siteConfig.config.CACHE.caching);
         if (!globalCache) return false;

         const metadataCache= (globalCache && MOVIEAPP.siteConfig.config.CACHE.metadata_cache);
         const recommendationsCache= (globalCache && MOVIEAPP.siteConfig.config.CACHE.recommendations_cache);
              
         const useCache= ((Symbol.for(cmd)==MOVIEAPP_CMD_FETCHSUGGESTIONS && recommendationsCache)||(Symbol.for(cmd)!=MOVIEAPP_CMD_FETCHSUGGESTIONS && metadataCache));
          
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

  const _fetch = function (url,method='get',data=null,useCache=false,useCompression=true) {
    
        //get from cache
        if (useCache ) {
            const key=JSON.stringify(url)+JSON.stringify(method)+JSON.stringify(data);
            const existsInCache =   localstore.has(key);
            if (existsInCache) {
              let cachedResponse = localstore.get(key);
              return Promise.resolve (cachedResponse);
            }
          };

            
   var methodHeaders = new Headers();
    if (method=='post') {
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
      headers: methodHeaders ,
      body: data
    })
    .then (function (response) {  //check response
          if (response.ok && response.status >= 200 && response.status < 300) {
            return response
          } else {
            var error = new Error(response.statusText)
            error.response = response
            return Promise.reject(error);
          };
    })
    .then(function (response) { //return json

        return response.json()
        .then(jsonResponseData => {
                
            if (useCache ) { //save in cache if not exists
            const key=JSON.stringify(url)+JSON.stringify(method)+JSON.stringify(data);
            const existsInCache =   localstore.has(key);
            if (!existsInCache)  
                localstore.set(key,jsonResponseData,useCompression);

            };
            return Promise.resolve(jsonResponseData);
        });

    })
     .catch(function (error) {
        MOVIEAPP.helpers.logError('Request failed', error);
        return Promise.reject(error);
      });

  }; //end _fetch

  return {
    store: localstore,
    shouldCache:useCacheForCommand,
    fetchCache:_fetch
  };

})();
