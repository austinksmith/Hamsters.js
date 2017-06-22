/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

let hamsterEnvironment = require("./environment/setup-environment");
const hamsterWheel = require("./wheel/hamster-wheel");
const hamsterTools = require("./tools/hamster-tools");
const memoizer = require("./cache/memoizer");
const threadPool = require("./pool/thread-pool");
const executeTask = require("./hamsters-run");

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
    hamsters.wheel.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + ')();'));
  }
  if(hamsterEnvironment.persistence) {
    var i = hamsters.maxThreads;
    for (i; i > 0; i--) {
      if(hamsterEnvironment.ie10) {
        hamsters.wheel.hamsters.push(new Worker('src/common/wheel.min.js'));
      }
      if(hamsterEnvironment.worker) {
        hamsters.wheel.hamsters.push(new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel'));
      } else {
        hamsters.wheel.hamsters.push(new Worker(hamsters.wheel.uri));
      }
    }
  }
};


module.exports = {
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
  },
  run: executeTask
};
