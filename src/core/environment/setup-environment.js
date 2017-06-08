/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

let detectedEnvironment = require("./detect-environment");
let maxThreads = 4;
let threads = [];
let uri = null;

const setupBrowserSupport = () => {
	if(['Kindle/3.0', 'Mobile/8F190', 'IEMobile'].indexOf(navigator.userAgent) !== -1) {
    detectedEnvironment.legacy = true;
  }
  if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
    detectedEnvironment.maxThreads = (maxThreads > 20 ? 20 : maxThreads);
  }
  if(detectedEnvironment.ie10) {
    try {
      var hamster = new Worker('../../common/wheel.min.js');
      hamster.terminate();
    } catch(e) {
      detectedEnvironment.legacy = true;
    }
  }
};

if(typeof navigator !== "undefined") {
  detectedEnvironment.maxThreads = navigator.hardwareConcurrency;
}

if(detectedEnvironment.browser) {
  setupBrowserSupport();
}

if(detectedEnvironment.reactNative || detectedEnvironment.node) {
  global.self = global;
}
 
module.exports = detectedEnvironment;