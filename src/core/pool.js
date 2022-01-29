/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersData from './data';
import hamstersHabitat from './habitat';

class pool {
	
  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    'use strict';

    this.tasks = [];
	  this.threads = [];
    this.running = [];
    this.pending = [];
    this.fetchHamster = this.getAvailableThread;
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
    if(hamstersHabitat.debug) {
      let threads = task.scheduler.metrics.threads;
      let thread = threads[threads.length - 1];
      thread.enqueued_at = Date.now();
    }
    this.pending.push({
      index: index,
      count: threads.length,
      task: task,
      resolve: resolve,
      reject: reject
    });
  }

  /**
  * @function processQueuedItem - Invokes processing of next item in queue
  * @param {object} item - Task to process
  */
  processQueuedItem(hamster, item) {
    if(hamstersHabitat.debug) {
      let threads = item.task.scheduler.metrics.threads;
      let thread = threads[item.count];
      thread.dequeued_at = Date.now();
    }
  	return this.runTask(hamster, item.index, item.task, item.resolve, item.reject);
  }

  /**
  * @function getAvailableThread- Keeps track of threads running, scoped globally and to task
  * @param {number} threadId - Id of thread
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  */
  getAvailableThread(threadId) {
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
    if(hamstersHabitat.debug) {
      let threads = task.scheduler.metrics.threads;
      let thread = threads[threads.length - 1];
      thread.started_at = Date.now();
    }
    task.scheduler.workers.push(id); //Keep track of threads scoped to current task
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
    task.scheduler.count += 1;
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
    if(hamstersHabitat.maxThreads <= this.running.length) {
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
    if(hamstersHabitat.debug) {
      task.scheduler.metrics.completed_at = Date.now();
      console.info("Hamsters.js Task Completed: ", task);
    }
    this.tasks[task.id] = null; //Clean up our task, not needed any longer
  }

  removeFromRunning(task, threadId) {
    this.running.splice(this.running.indexOf(threadId), 1); //Remove thread from running pool
    task.scheduler.workers.splice(task.scheduler.workers.indexOf(threadId), 1); //Remove thread from task running pool
  }

  processReturn(habitat, index, message, task) {
    let output = message.data;
    if(habitat.reactNative) {
      output = JSON.parse(message).data;
    } else if(typeof message.data.data !== "undefined") {
      output = message.data.data;
    }
    if(task.scheduler.threads !== 1) {
      hamstersData.addThreadOutputWithIndex(task, index, output);
    } else {
      task.input.array = output;
    }
  }

  setOnMessage(hamster, onThreadResponse, habitat, reject) {
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
      pool.removeFromRunning(task, task.scheduler.count);
      if (task.scheduler.workers.length === 0 && task.scheduler.count === task.scheduler.threads) {
        pool.returnOutputAndRemoveTask(task, resolve);
      }
      if(habitat.debug) {
        task.scheduler.metrics.threads[task.scheduler.metrics.threads.length - 1].completed_at = Date.now();
      }
      if (pool.pending.length !== 0) {
        return pool.processQueuedItem(hamster, pool.pending.shift());
      }
      if(!habitat.persistence) {
        return hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    };
    pool.setOnMessage(hamster, onThreadResponse, habitat, reject);
  }

  /**
  * @function scheduleTask - Adds new task to the system for execution
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Scaffold to execute login within
  * @param {number} maxThreads - Maximum number of threads for this client
  */
  scheduleTask(task) {
    let i = 0;
    if(hamstersHabitat.debug) {
      let metrics = task.scheduler.metrics;
      metrics.started_at = Date.now();
      return new Promise((resolve, reject) => {
        while (i < task.scheduler.threads) {
          metrics.threads.push({
            created_at: Date.now(),
            started_at: null,
            enqueued_at: null,
            dequeued_at: null,
            completed_at: null
          });
          this.hamsterWheel(task.scheduler.indexes[i], task, resolve, reject);
          i += 1;
        }
      });
    }
    //Process with debug mode disabled, no need for time stamping
  	return new Promise((resolve, reject) => {
      while (i < task.scheduler.threads) {
        this.hamsterWheel(task.scheduler.indexes[i], task, resolve, reject);
        i += 1;
      }
    });
  }
}

var hamsterPool = new pool();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterPool;
}
