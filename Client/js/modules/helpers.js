
var MOVIEAPP = MOVIEAPP || {};

MOVIEAPP.helpers = (function () {

  /**
   * initialize helper functions by overriding prototypes
   */
  function init() {

    String.isNullOrEmpty = value => (value == null || value === "");

  } //end init;

 

  //*
  //PUBLIC FUNCTIONS
  //*

  const capitalize = str => str.length ?
    str[0].toUpperCase() + str.slice(1).toLowerCase() : '';

  const titleCase = str => str.split(/\s+/).map(capitalize).join(' ');

  //created and tested online using regexe101.com online service
  //test url : https://regex101.com/r/3mx0L7/1
  const matchYearInParenthesis = str => str.match(/\(([^)]*\d)\)[^(]*$/g)[0];

  const cloneObject = obj => Object.assign({}, obj);
  const deepCloneObject = obj =>  JSON.parse(JSON.stringify(obj));



const compressObject = obj => {
 MOVIEAPP.helpers.log("compression started...");
 const packed =jsonpack.pack(obj);
 const compressed = LZString.compressToUTF16 (packed);
 MOVIEAPP.helpers.log("compression finished...");
 return compressed;
};

const uncompressObject = compressed => {
    MOVIEAPP.helpers.log("uncompression started...");
    const uncompressed = LZString.decompressFromUTF16(compressed);
    const unpacked=jsonpack.unpack(uncompressed);
    MOVIEAPP.helpers.log("uncompression finished...");
    return unpacked;
};


const log = (msg,msglevel='debug') =>{

   if (!MOVIEAPP.siteConfig.config.LOG.logging) return;

   const logLevels=['none','error','info','debug'];
   const logLevelsColors=['#ffffff','#EE0000','#0000EE','#00EE00'];

   const current_level = MOVIEAPP.siteConfig.config.LOG.logging_level;
   
   if (!logLevels.includes(msglevel)) return;

   if (current_level!='none' && (logLevels.indexOf(msglevel)  <= logLevels.indexOf(current_level)))
   {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;

    const time=(new Date(Date.now() - tzoffset)).toISOString().substr(11, 8);
    const levelcolor = logLevelsColors[logLevels.indexOf(msglevel)];
    const message = `%c[${msglevel}] %c${time} : %c${JSON.stringify(msg)}`;
    const messagecolor = `color:${levelcolor}`;

    console.log(message,messagecolor,'color:#000;font-weight: bold;','color:#000');
   }
};

const logError = (msg,err=null) => {
  if (err!=null) 
  msg+="(" + err.lineno||'' + " - " + err.message||'' + " in " + err.filename||'' +")";
  
  log(msg,'error');
};
const logInfo = (msg) => log(msg,'info');


  //initialize 
  init();
  return {
    capitalize: capitalize,
    titleCase: titleCase,
    matchYearInParenthesis:matchYearInParenthesis,
    cloneObject:cloneObject,
    deepCloneObject:deepCloneObject,
    compressObject:compressObject,
    uncompressObject:uncompressObject,
    log:log,
    logInfo:logInfo,
    logError:logError
  };
})();
