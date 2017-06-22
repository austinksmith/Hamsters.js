/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const newTask = require('./wheel/task/new-task');
const hamsterEnvironment = require('./environment/setup-environment');
const executeTask = require('./wheel/task/execute-task');
const runningTasks = require('./pool/thread-pool').runningTasks;

module.exports = (threadParams, functionToExecute, onSuccess, numberOfThreads, aggregateThreadOutputs, dataType, memoize, order) => {
  var totalWorkers = numberOfThreads;
  if(hamsterEnvironment.legacy) {
    totalWorkers = 1;
  }
  var task = newTask(runningTasks.length, totalWorkers, order, dataType, functionToExecute, onSuccess);
  if(dataType) {
    dataType = dataType.toLowerCase();
  }
  // if(hamsters.cache && memoize) {
  //   var result = this.wheel.checkCache(functionToExecute, task.input, dataType);
  //   if(result) {
  //     setTimeout(function() {
  //       hamsters.wheel.tasks[taskid] = null; //Clean up our task, not needed any longer
  //       onSuccess(result);
  //     }, 4);
  //     return;
  //   }
  // }
  executeTask(task, threadParams, functionToExecute, onSuccess, aggregateThreadOutputs, dataType, memoize, order);
};