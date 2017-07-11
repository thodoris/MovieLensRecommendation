
var MOVIEAPP = MOVIEAPP || {};

MOVIEAPP.uihelpers = (function () {

 //*
  //PRIVATE FUNCTIONS
  //*
  const _getBrowserInfo = () => {
    var ua = navigator.userAgent, tem, M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if (/trident/i.test(M[1])) {
      tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
      return { name: 'IE ', version: (tem[1] || '') };
    }
    if (M[1] === 'Chrome') {
      tem = ua.match(/\bOPR\/(\d+)/)
      if (tem != null) { return { name: 'Opera', version: tem[1] }; }
    }
    M = M[2] ? [M[1], M[2]] : [navigator.appName, navigator.appVersion, '-?'];
    if ((tem = ua.match(/version\/(\d+)/i)) != null) { M.splice(1, 1, tem[1]); }
    return {
      name: M[0].toLowerCase(),
      version: parseInt(M[1])
    };
  };

  const _isCompatibleBrowser = () => {

    const compatibleBrowserList = MOVIEAPP.siteConfig.config.COMPATIBILITY.compatibleBrowserList;
    var b = _getBrowserInfo();
    return (compatibleBrowserList[b.name].acceptedVersion <= b.version);

  };

  const _createCookie = (name, value, days) => {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      var expires = "; expires=" + date.toGMTString();
    } else var expires = "";
    document.cookie = name + "=" + value + expires + "; path=/";
  };

  const _readCookie = (name) => {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

 //*
  //PUBLIC FUNCTIONS
  //*

  function template(strings, ...interpolatedValues) {
    return strings.reduce((total, current, index) => {
      total += current;
      if (interpolatedValues.hasOwnProperty(index)) {
        total += String(interpolatedValues[index]).trim().replace(/^\s+|\s+$/gm, '').split('\n').join('');
      }
      return total.replace(/^\s+|\s+$/gm, '').split('\n').join('');
    }, '');
  };
  
    const  htmlToElement = html => {
    var template = document.createElement('template');
    template.innerHTML = html;
    return template.content.firstChild.cloneNode(true);;
};

  const  addAnimation = (element, animationClass)=> {
    
  const pfx = ["webkit", "moz", "MS", "o", ""];
  let type="AnimationEnd";

  element.style.visibility=="hidden";
  element.classList.add(animationClass);

	for (var p = 0; p < pfx.length; p++) {
		if (!pfx[p]) type = type.toLowerCase();
		element.addEventListener(pfx[p]+type,  evt => evt.target.classList.remove(animationClass), false);
	}
};

  
const checkBrowserCompatibility = () => {

  let errors=[];

  //1. check if running from server or file system
  if (!window.location.protocol.toLowerCase().startsWith("http")) 
    errors.push("You must run the application from a host (http or https)!");

  //2. check if Web workers are supported by the browser
  if (!window.Worker)
  errors.push("Your browser doesn't support Web Workers!");

  //3 check if localStorage is supported by the browser
  if (!window.localStorage)
  errors.push("Your browser doesn't support localStorage!");
  
  //4 check if browser is compatibleBrowserList
  if ((MOVIEAPP.siteConfig.config.COMPATIBILITY.checkBrowserCompatibility) && !_isCompatibleBrowser())
  errors.push("Your browser is outdated!");

 //5 check if the browser supports input type=range (for sliders)
 try {
    let testinputrange = document.createElement("input");
    testinputrange.type = "range";

    if (!testinputrange.type === "range")
    errors.push("Your browser doesn't support HTML 5 element for ranges!");

} catch(e) {
   errors.push("Your browser doesn't support HTML 5 element for ranges!");
}

  return errors;
};

//check if is the first visit and set cookie
const isFirstVisit = () => {

if (!_readCookie("MOVIEAPP_instructionsSeen")) {
    _createCookie("MOVIEAPP_instructionsSeen", "1", 1000);
    return true;
} 
return false;

};

  return {
    template: template,
    htmlToElement,htmlToElement,
    addAnimation:addAnimation,
    checkBrowserCompatibility:checkBrowserCompatibility,
    isFirstVisit:isFirstVisit
  };
})();



