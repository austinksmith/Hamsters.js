/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const hamsterEnvironment = require("./environment/setup-environment");
const hamsterTools = require("./tools/hamster-tools");
const memoizer = require("./cache/memoizer");
const threadPool = require("./pool/thread-pool");

const processStartOptions = (startOptions) => {
  let key;
  for(key in startOptions) {
    if(startOptions.hasOwnProperty(key)) {
      if(key === "maxThreads") {
        hamsters.habitat[key] = startOptions[key];
      } else {
        hamsters[key] = startOptions[key];
      }
    }
  }
};

const wakeHamsters = () => {
  if(hamsterEnvironment.browser) {
    hamsters.wheel.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + ')();'));
  }
  if(hamsters.persistence) {
    var i = hamsters.maxThreads;
    for (i; i > 0; i--) {
      if(hamsters.wheel.env.ie10) {
        hamsters.wheel.hamsters.push(new Worker('src/common/wheel.min.js'));
      }
      if(hamsters.wheel.env.worker) {
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
  debug: false,
  cache: false,
  atomics: false,
  habitat: hamsterEnvironment,
  pool: threadPool,
  tools: hamsterTools,
  memoizer: memoizer,
  wheel: hamsterWheel,
  errors: [],
  init: (startOptions) => {
    if(typeof startOptions !== "undefined") {
      processStartOptions(startOptions);
    }
    wakeHamsters();
  },
  run: (threadParams, functionToExecute, onSuccess, numberOfThreads, aggregateThreadOutputs, dataType, memoize, order) => {
    var totalWorkers = numberOfThreads;
    if(hamsterEnvironment.legacy) {
      totalWorkers = 1;
    }
    var task = newTask(hamsterWheel.tasks.length, totalWorkers, order, dataType, functionToExecute, onSuccess);
    if(dataType) {
      dataType = dataType.toLowerCase();
    }
    if(hamsters.cache && memoize) {
      var result = this.wheel.checkCache(functionToExecute, task.input, dataType);
      if(result) {
        setTimeout(function() {
          hamsters.wheel.tasks[taskid] = null; //Clean up our task, not needed any longer
          onSuccess(result);
        }, 4);
        return;
      }
    }
    this.wheel.work(task, threadParams, functionToExecute, onSuccess, aggregateThreadOutputs, dataType, memoize, order);
  }
};
