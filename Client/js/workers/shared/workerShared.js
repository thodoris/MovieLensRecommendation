  const _fetch = function (url,method='get',data=null) {
    
   var methodHeaders = method == 'post' ? new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Origin': '*'
    }) : new Headers({});
    
    // let methodHeaders = (method == 'post') ? {
    //   'Accept': 'application/json',
    //   'Content-Type': 'application/json',
    //   'Origin': null
    // } : {};

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
    .then(function (response) {
        return response.json();
     })
     .catch(function (error) {
        MOVIEAPP.helpers.logError('Request failed', error);
        return Promise.reject(error);
      });

  }; //end _fetch

const _PostMessage = function (msg) {

  if (MOVIEAPP.siteConfig.config.useCompression)
  {
     const compressed = MOVIEAPP.helpers.compressObject(msg);
     postMessage(compressed);
  }
  else
  postMessage(JSON.stringify(msg));

}