/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

'use strict';

import hamstersData from './data';
import hamstersHabitat from './habitat';
import hamstersLogger from './logger';

class pool {
	
  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.tasks = [];
	  this.threads = [];
    this.running = [];
    this.pending = [];
    this.fetchHamster;
  }

  /**
  * @function fetchHamster - Adds task to queue waiting for available thread
  * @param {object} array - Provided data to execute logic on
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  addWorkToPending(index, task, resolve, reject) {
  	this.pending.push({
      index,
      task,
      resolve,
      reject
    });
  }

  /**
  * @function fetchHamster - Invokes processing of next item in queue
  * @param {object} item - Task to process
  */
  processQueue(item, hamster) {
  	return this.runTask(hamster, ...item);
  }

  /**
  * @function fetchHamster - Keeps track of threads running, scoped globally and to task
  * @param {number} threadId - Id of thread
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  */
  fetchHamster(threadId) {
    if(hamstersHabitat.persistence) {
      return this.threads[threadId];
    }
    return this.spawnHamster();
  }

  /**
  * @function keepTrackOfThread - Keeps track of threads running, scoped globally and to task
  * @param {object} task - Provided library functionality options for this task
  * @param {number} id - Id of thread to track
  */
  keepTrackOfThread(task, id) {
    task.workers.push(id); //Keep track of threads scoped to current task
    this.running.push(id); //Keep track of all currently running threads
  }

  /**
  * @function registerTask - Adds task to execution pool based on id
  * @param {number} id - Id of task to register
  */
  registerTask(id) {
    this.tasks.push(id);
  }

  /**
  * @function spawnHamsters - Spawns multiple new threads for execution
  * @param {function} wheel - Results from select hamster wheel
  * @param {number} maxThreds - Max number of threads for this client
  */
  spawnHamsters(maxThreads) {
    for (maxThreads; maxThreads > 0; maxThreads--) {
      this.threads.push(this.spawnHamster());
    }
  }

  /**
  * @function spawnHamster - Spawns a new thread for execution
  * @return {object} WebWorker - New WebWorker thread using selected scaffold
  */
  spawnHamster() {
    if (hamstersHabitat.webWorker) {
      return new hamstersHabitat.SharedWorker(hamstersHabitat.hamsterWheel, 'SharedHamsterWheel');
    }
    if(hamstersHabitat.node && typeof hamstersHabitat.parentPort !== 'undefined') {
      return new hamstersHabitat.Worker(hamstersHabitat.hamsterWheel);
    }
    return new hamstersHabitat.Worker(hamstersHabitat.hamsterWheel);
  }

  /**
  * @function prepareMeal - Prepares message to send to a thread and invoke execution
  * @param {object} threadArray - Provided data to execute logic on
  * @param {object} task - Provided library functionality options for this task
  * @return {object} hamsterFood - Prepared message to send to a thread
  */
  prepareMeal(index, task) {
    const hamsterFood = {};
    hamsterFood.array = hamstersData.getSubArrayFromIndex(index, task);
    for (var key in task.input) {
      if (task.input.hasOwnProperty(key) && ['array', 'threads'].indexOf(key) === -1) {
        hamsterFood[key] = task.input[key];
      }
    }
    return hamsterFood;
  }

  /**
  * @function hamsterWheel - Runs function using thread
  * @param {object} array - Provided data to execute logic on
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  runTask(hamster, index, task, resolve, reject) {
  	let threadId = this.running.length;
    let hamsterFood = this.prepareMeal(index, task);
    this.registerTask(task.id);
    this.keepTrackOfThread(task, threadId);
    if(hamstersHabitat.legacy) {
      hamstersHabitat.legacyWheel(hamstersHabitat, hamsterFood, resolve, reject);
    } else {
      this.trainHamster(this, hamstersHabitat, index, task, hamster, resolve, reject);
      hamstersData.feedHamster(hamstersHabitat, hamster, hamsterFood);
    }
    task.count += 1; //Increment count, thread is running
  }

  /**
  * @function hamsterWheel - Runs or queues function using threads
  * @param {object} array - Provided library functionality options for this task
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  hamsterWheel(index, task, resolve, reject) {
    if(hamstersHabitat.maxThreads === this.running.length) {
      return this.addWorkToPending(index, task, resolve, reject);
    }
    let hamster = this.fetchHamster(this.running.length);
    return this.runTask(hamster, index, task, resolve, reject);
  }

  /**
  * @function returnOutputAndRemoveTask - gathers thread outputs into final result
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  */
  returnOutputAndRemoveTask(task, resolve) {
    if (task.sort) {
      resolve(hamstersData.sortOutput(task.input.array, task.sort));
    } else {
      resolve(task.input.array);
    }
    this.tasks[task.id] = null; //Clean up our task, not needed any longer
  }

  removeFromRunning(task, threadId) {
    this.running.splice(this.running.indexOf(threadId), 1); //Remove thread from running pool
    task.workers.splice(task.workers.indexOf(threadId), 1); //Remove thread from task running pool
  }

  processReturn(habitat, index, message, task) {
    let output = message.data;
    if(habitat.reactNative) {
      output = JSON.parse(message).data;
    }
    if(typeof message.data.data !== "undefined") {
      output = message.data.data;
    }
    if(task.threads !== 1) {
      hamstersData.addThreadOutputWithIndex(task, index, output);
    } else {
      task.input.array = output;
    }
  }

  /**
  * @function trainHamster - Trains thread in how to behave
  * @param {number} threadId - Internal use id for this thread
  * @param {object} task - Provided library functionality options for this task
  * @param {worker} hamster - Thread to train
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  trainHamster(pool, habitat, index, task, hamster, resolve, reject) {
    let onThreadResponse = (message) => {
      pool.processReturn(habitat, index, message, task);
      pool.removeFromRunning(task, task.count);
      if (task.workers.length === 0 && task.count === task.threads) {
        pool.returnOutputAndRemoveTask(task, resolve);
      }
      if (pool.pending.length !== 0) {
        return pool.processQueue(pool.pending.shift(), hamster);
      }
      if(!habitat.persistence) {
        return hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    }
    if (habitat.webWorker) {
      hamster.port.onmessage = onThreadResponse;
      hamster.port.onmessageerror = reject;
      hamster.port.onerror = reject;
    }
    if(habitat.node) {
      hamster.once('message', onThreadResponse);
      hamster.once('onmessageerror', reject);
      hamster.once('error', reject);
    } else {
      hamster.onmessage = onThreadResponse;
      hamster.onmessageerror = reject;
      hamster.error = reject;
    }
  }

  /**
  * @function scheduleTask - Adds new task to the system for execution
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Scaffold to execute login within
  * @param {number} maxThreads - Maximum number of threads for this client
  */
  scheduleTask(task) {
  	return new Promise((resolve, reject) => {
      let i = 0;
      while (i < task.threads) {
        this.hamsterWheel(task.indexes[i], task, resolve, reject);
        i += 1;
      }
    });
  }
}

var hamsterPool = new pool();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterPool;
}
