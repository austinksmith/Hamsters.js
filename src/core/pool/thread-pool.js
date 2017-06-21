/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const newHamster = require("../wheel/thread/new-hamster");
const newWheel = require("../wheel/new-wheel");
const giveHamsterWork = require("../wheel/hamster-wheel");

module.exports = {
	pendingTasks: [],
	runningTasks: [],
	activeThreads: [],
	spawnHamsters: (persistence, number) => {
	  if(typeof URL !== "undefined") {
	    uri = URL.createObjectURL(createBlob("(" + String(giveHamsterWork()) + ")();"));
	  }
	  if(persistence) {
	    let i = number;
	    for (i; i > 0; i--) {
	      this.activeThreads.push(newHamster());
	    }
	  }
	},
	poolThread: (inputArray, hamsterfood, threadid, cb, task, agg, memoize) => {
    pendingTasks.push({
      memoize: memoize,
      input: inputArray,
      params: hamsterfood,
      workerid: threadid, 
      callback: cb, 
      task: task,
      aggregate: agg
    });
  },
  processQueue: (hamster, item) => {
    if(!item) {
      return;
    }
    newWheel(item.input, item.params, item.aggregate, item.callback, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
  },
  trackInput: (inputArray, threadid, task, hamsterfood) => {
  	const started = new Date().getTime();
    task.input.push({ 
      input: inputArray,
      workerid: threadid, 
      taskid: task.id, 
      params: hamsterfood, 
      start: started
    });
  },
  trackThread: (task, running, id) => {
    task.workers.push(id); //Keep track of threads scoped to current task
    runningTasks.push(id); //Keep track of all currently running threads
  },
  poolThread: (inputArray, hamsterfood, threadid, cb, task, agg, memoize) => {
    pendingTasks.push({
      memoize: memoize,
      input: inputArray,
      params: hamsterfood,
      workerid: threadid, 
      callback: cb, 
      task: task,
      aggregate: agg
    });
  }
};