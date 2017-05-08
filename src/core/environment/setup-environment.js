/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

let environment = require("./detect-environment");
let maxThreads = 4;
let threads = [];
let uri = null;

const setupBrowserSupport = () => {
	if(['Kindle/3.0', 'Mobile/8F190', 'IEMobile'].indexOf(navigator.userAgent) !== -1) {
    environment.legacy = true;
  }
  // if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
  //   maxThreads = (maxThreads > 20 ? 20 : maxThreads);
  // }
  // if(isIE(10)) {
  //   try {
  //     var hamster = new Worker('src/common/wheel.min.js');
  //     hamster.terminate();
  //     hamsters.wheel.env.ie10 = true;
  //   } catch(e) {
  //     hamsters.wheel.env.legacy = true;
  //   }
  // }
};

if(typeof navigator !== "undefined") {
  maxThreads = navigator.hardwareConcurrency;
}

if(environment.browser) {
  setupBrowserSupport();
}

if(environment.reactNative || environment.node) {
  global.self = global;
}
 
module.exports = environment;