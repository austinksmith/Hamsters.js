/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const legacyWorker = require("./worker/legacy-worker");
const trackThread = require("../pool/thread-pool").trackThread;
const trackInput = require("../pool/thread-pool").trackInput;
// const memoizer = require("./");
const cleanUpTask = require("../wheel/task/clean-task");

module.exports = (inputArray, hamsterFood, aggregate, onSuccess, task, threadId, hamster, memoize) => {
  trackThread(task, hamsters.wheel.queue.running, threadid);
  if(memoize || hamsters.debug) {
    trackInput(inputArray, threadId, task, hamsterFood);
  }
  legacyWorker((hamsterFood, inputArray, output) => {
    cleanUpTask(task, threadId);
    task.output[threadId] = output.data;
    if(task.workers.length === 0 && task.count === task.threads) {
      onSuccess(getOutput(task.output, aggregate, output.dataType));
      hamsters.wheel.tasks[task.id] = null;
      // if(hamsters.cache && memoize !== false) {
      //   memoize(task.fn, task.input, output.data, output.dataType);
      // }
    }
  });
  task.count += 1; //Thread finished
};