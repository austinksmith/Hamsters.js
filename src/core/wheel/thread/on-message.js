/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";


const environment = require("../../environment/setup-environment");
const sortOutput = require("../../tools/array/sort-array");
const processQueue = require('../../pool/thread-pool');
const cleanTask = require('../task/clean-task');

module.exports = (id, aggregate, onSuccess, task, hamster, memoize) => {
  cleanTask(task, id);
  let results = e.data.results;
  task.output[id] = results.data;
  // if(debug === "verbose") {
  //   console.info("Hamster #" + id + " finished " + "@ " + e.timeStamp);
  // }
  if(task.workers.length === 0 && task.count === task.threads) {
    if(task.order) {
      onSuccess(sortOutput(getOutput(task.output, aggregate, results.dataType), task.order));
    } else {
      onSuccess(getOutput(task.output, aggregate, results.dataType));
    }
    // if(debug) {
    //   console.info("Execution Complete! Elapsed: " + ((e.timeStamp - task.input[0].start)/1000) + "s");
    // }
    tasks[task.id] = null; //Clean up our task, not needed any longer
  }
  if(threadPool.pendingTasks.length !== 0) {
    processQueue(hamster, threadPool.pendingTasks.shift());
  } else if(!persistence && !environment.worker) {
    hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
  }
};