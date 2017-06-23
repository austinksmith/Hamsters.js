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
const createBlob = require("./wheel/data/create-blob");
const giveHamsterWork = require("./processor/hamster-worker");



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
        threadPool.activeThreads.push(new Worker('src/common/wheel.min.js'));
      }
      if(hamsterEnvironment.worker) {
        threadPool.activeThreads.push(new SharedWorker(hamsterEnvironment.uri, 'SharedHamsterWheel'));
      } else {
        threadPool.activeThreads.push(new Worker(hamsterEnvironment.uri));
      }
    }
  }
};

  function setupBrowserSupport() {
    if(!Worker || ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'].indexOf(navigator.userAgent) !== -1) {
      hamsterEnvironment.legacy = true;
    }
    if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
      hamsters.maxThreads = (hamsters.maxThreads > 20 ? 20 : hamsters.maxThreads);
    }
    if(hamsterEnvironment.ie10) {
      try {
        var hamster = new Worker('src/common/wheel.min.js');
        hamster.terminate();
      } catch(e) {
        hamsterEnvironment.legacy = true;
      }
    }
  }

  function setupWorkerSupport() {
    try {
      hamsters.wheel.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + '());'));
      var SharedHamster = new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel');
    } catch(e) {
      hamsterEnvironment.legacy = true;
    }
  }

  function setupHamstersEnvironment(startOptions) {
    if(typeof startOptions !== "undefined") {
      processStartOptions(startOptions);
    }
    if(hamsterEnvironment.browser && !hamsterEnvironment.reactNative) {
      setupBrowserSupport();
    }
    if(hamsterEnvironment.worker) {
      setupWorkerSupport();
    }
    if(hamsterEnvironment.node || hamsterEnvironment.reactNative) {
      global.self = global;
      if(typeof hamsters.Worker !== 'undefined') {
        global.Worker = hamsters.Worker;
      }
    }
    if(hamsterEnvironment.shell || typeof Worker === 'undefined') {
      hamsterEnvironment.legacy = true;
    }
    if(typeof Uint8Array === 'undefined') {
      hamsterEnvironment.transferrable = false;
    }
    if(typeof SharedArrayBuffer !== 'undefined') {
      hamsterEnvironment.atomics = true;
    }
    if(!hamsterEnvironment.legacy) {
      spawnHamsters();
    }
  }

  function spawnHamsters() {
    if(hamsterEnvironment.browser) {
      hamsterEnvironment.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + ')();'));
    }
    if(true) {
      var i = hamsterEnvironment.maxThreads;
      for (i; i > 0; i--) {
        if(hamsterEnvironment.ie10) {
          threadPool.activeThreads.push(new Worker('./common/wheel.min.js'));
        } else if(hamsterEnvironment.node && !hamsterEnvironment.browser) {
          threadPool.activeThreads.push(new Worker(giveHamsterWork()));
        } else if(hamsterEnvironment.worker) {
          threadPool.activeThreads.push(new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel'));
        } else {
          threadPool.activeThreads.push(new Worker(hamsterEnvironment.uri));
        }
      }
    }
  }

self.hamsters = {
  version: "4.2.0",
  persistence: true,
  habitat: hamsterEnvironment,
  pool: threadPool,
  tools: hamsterTools,
  errors: [],
  init: (startOptions) => {
    setupHamstersEnvironment(startOptions);
  },
  run: executeTask
};

module.exports = hamsters;
