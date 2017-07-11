'use strict';

var MOVIEAPP = MOVIEAPP || {};

MOVIEAPP.helpers = function () {

  /**
   * initialize helper functions by overriding prototypes
   */
  function init() {

    String.isNullOrEmpty = function (value) {
      return value == null || value === "";
    };
  } //end init;


  //*
  //PUBLIC FUNCTIONS
  //*

  var capitalize = function capitalize(str) {
    return str.length ? str[0].toUpperCase() + str.slice(1).toLowerCase() : '';
  };

  var titleCase = function titleCase(str) {
    return str.split(/\s+/).map(capitalize).join(' ');
  };

  //created and tested online using regexe101.com online service
  //test url : https://regex101.com/r/3mx0L7/1
  var matchYearInParenthesis = function matchYearInParenthesis(str) {
    return str.match(/\(([^)]*\d)\)[^(]*$/g)[0];
  };

  var cloneObject = function cloneObject(obj) {
    return Object.assign({}, obj);
  };
  var deepCloneObject = function deepCloneObject(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

  var compressObject = function compressObject(obj) {
    MOVIEAPP.helpers.log("compression started...");
    var packed = jsonpack.pack(obj);
    var compressed = LZString.compressToUTF16(packed);
    MOVIEAPP.helpers.log("compression finished...");
    return compressed;
  };

  var uncompressObject = function uncompressObject(compressed) {
    MOVIEAPP.helpers.log("uncompression started...");
    var uncompressed = LZString.decompressFromUTF16(compressed);
    var unpacked = jsonpack.unpack(uncompressed);
    MOVIEAPP.helpers.log("uncompression finished...");
    return unpacked;
  };

  var log = function log(msg) {
    var msglevel = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'debug';


    if (!MOVIEAPP.siteConfig.config.LOG.logging) return;

    var logLevels = ['none', 'error', 'info', 'debug'];
    var logLevelsColors = ['#ffffff', '#EE0000', '#0000EE', '#00EE00'];

    var current_level = MOVIEAPP.siteConfig.config.LOG.logging_level;

    if (!logLevels.includes(msglevel)) return;

    if (current_level != 'none' && logLevels.indexOf(msglevel) <= logLevels.indexOf(current_level)) {
      var tzoffset = new Date().getTimezoneOffset() * 60000;

      var time = new Date(Date.now() - tzoffset).toISOString().substr(11, 8);
      var levelcolor = logLevelsColors[logLevels.indexOf(msglevel)];
      var message = '%c[' + msglevel + '] %c' + time + ' : %c' + JSON.stringify(msg);
      var messagecolor = 'color:' + levelcolor;

      console.log(message, messagecolor, 'color:#000;font-weight: bold;', 'color:#000');
    }
  };

  var logError = function logError(msg) {
    var err = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    if (err != null) msg += "(" + err.lineno || '' + " - " + err.message || '' + " in " + err.filename || '' + ")";

    log(msg, 'error');
  };
  var logInfo = function logInfo(msg) {
    return log(msg, 'info');
  };

  //initialize 
  init();
  return {
    capitalize: capitalize,
    titleCase: titleCase,
    matchYearInParenthesis: matchYearInParenthesis,
    cloneObject: cloneObject,
    deepCloneObject: deepCloneObject,
    compressObject: compressObject,
    uncompressObject: uncompressObject,
    log: log,
    logInfo: logInfo,
    logError: logError
  };
}();