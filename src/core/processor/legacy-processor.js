/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const trackThread = require("./");
const trackInput = require("./");
const memoize = require("./");
const clean = require("./");

module.exports = (inputArray, hamsterfood, aggregate, onSuccess, task, threadid, hamster, memoize) => {
  trackThread(task, hamsters.wheel.queue.running, threadid);
  if(memoize || hamsters.debug) {
    trackInput(inputArray, threadid, task, hamsterfood);
  }
  legacyProcessor((hamsterfood, inputArray, output) => {
    hamsters.wheel.clean(task, threadid);
    task.output[threadid] = output.data;
    if(task.workers.length === 0 && task.count === task.threads) {
      onSuccess(getOutput(task.output, aggregate, output.dataType));
      hamsters.wheel.tasks[task.id] = null;
      if(hamsters.cache && memoize !== false) {
        memoize(task.fn, task.input, output.data, output.dataType);
      }
    }
  });
  task.count += 1; //Thread finished
};