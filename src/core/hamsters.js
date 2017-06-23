/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const hamsterWheel = require("./wheel/hamster-wheel");
const hamsterTools = require("./tools/hamster-tools");
const memoizer = require("./cache/memoizer");
const threadPool = require("./pool/thread-pool");


const processStartOptions = (startOptions) => {
  let key;
  for(key in startOptions) {
    if(startOptions.hasOwnProperty(key)) {
      if(key === "maxThreads") {
        hamsterEnvironment[key] = startOptions[key];
      } else {
        hamsterEnvironment[key] = startOptions[key];
      }
    }
  }
};

const wakeHamsters = () => {
  if(hamsterEnvironment.browser) {
    hamsterEnvironment.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + ')();'));
  }
  if(hamsterEnvironment.persistence) {
    var i = hamsterEnvironment.maxThreads;
    for (i; i > 0; i--) {
      if(hamsterEnvironment.ie10) {
        threadPool.hamsters.push(new Worker('src/common/wheel.min.js'));
      }
      if(hamsterEnvironment.worker) {
        threadPool.hamsters.push(new SharedWorker(hamsterEnvironment.uri, 'SharedHamsterWheel'));
      } else {
        threadPool.hamsters.push(new Worker(hamsterEnvironment.uri));
      }
    }
  }
};

  function setupBrowserSupport() {
    if(!Worker || ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'].indexOf(navigator.userAgent) !== -1) {
      hamsters.wheel.env.legacy = true;
    }
    if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
      hamsters.maxThreads = (hamsters.maxThreads > 20 ? 20 : hamsters.maxThreads);
    }
    if(isIE(10)) {
      try {
        var hamster = new Worker('src/common/wheel.min.js');
        hamster.terminate();
        hamsters.wheel.env.ie10 = true;
      } catch(e) {
        hamsters.wheel.env.legacy = true;
      }
    }
  }

  function setupWorkerSupport() {
    try {
      hamsters.wheel.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + '());'));
      var SharedHamster = new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel');
    } catch(e) {
      hamsters.wheel.env.legacy = true;
    }
  }

  function setupHamstersEnvironment(onSuccess) {
    hamsters.wheel.env.browser = typeof window === "object";
    hamsters.wheel.env.worker  = typeof importScripts === "function";
    hamsters.wheel.env.node = typeof process === "object" && typeof require === "function" && !hamsters.wheel.env.browser && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
    hamsters.wheel.env.reactNative = !hamsters.wheel.env.node && typeof global === 'object';
    hamsters.wheel.env.shell = !hamsters.wheel.env.browser && !hamsters.wheel.env.node && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
    if(typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency !== 'undefined') {
      hamsters.maxThreads = navigator.hardwareConcurrency;
    }
    if(typeof startOptions !== 'undefined') {
      processStartOptions();
    }
    if(hamsters.wheel.env.browser && !hamsters.wheel.env.reactNative) {
      setupBrowserSupport();
    }
    if(hamsters.wheel.env.worker) {
      setupWorkerSupport();
    }
    if(hamsters.wheel.env.node || hamsters.wheel.env.reactNative) {
      global.self = global;
      if(typeof hamsters.Worker !== 'undefined') {
        global.Worker = hamsters.Worker;
      }
    }
    if(hamsters.wheel.env.shell || typeof Worker === 'undefined') {
      hamsters.wheel.env.legacy = true;
    }
    if(typeof Uint8Array === 'undefined') {
      hamsters.wheel.env.transferrable = false;
    }
    if(typeof SharedArrayBuffer !== 'undefined') {
      hamsters.wheel.env.atomics = true;
    }
    onSuccess();
  }

  function spawnHamsters() {
    if(hamsters.wheel.env.browser) {
      hamsters.wheel.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + ')();'));
    }
    if(hamsters.persistence) {
      var i = hamsters.maxThreads;
      for (i; i > 0; i--) {
        if(hamsters.wheel.env.ie10) {
          hamsters.wheel.hamsters.push(new Worker('./common/wheel.min.js'));
        } else if(hamsters.wheel.env.node) {
          hamsters.wheel.hamsters.push(new Worker(giveHamsterWork()));
        } else if(hamsters.wheel.env.worker) {
          hamsters.wheel.hamsters.push(new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel'));
        } else {
          hamsters.wheel.hamsters.push(new Worker(hamsters.wheel.uri));
        }
      }
    }
  }

global.hamsters = {
  version: "4.2.0",
  persistence: true,
  habitat: hamsterEnvironment,
  pool: threadPool,
  tools: hamsterTools,
  errors: [],
  init: (startOptions) => {
    if(typeof startOptions !== "undefined") {
      processStartOptions(startOptions);
    }
    if(hamsterEnvironment.legacy) {

    }
  },
  run: executeTask
};

module.exports = hamsters;
