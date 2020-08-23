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
    this.fetchHamster = this.grabHamster;
  }

  /**
  * @function grabHamster - Adds task to queue waiting for available thread
  * @param {object} array - Provided data to execute logic on
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  addWorkToPending(array, task, persistence, wheel, resolve, reject) {
  	this.pending.push(arguments);
  }

  /**
  * @function grabHamster - Invokes processing of next item in queue
  * @param {object} item - Task to process
  */
  processQueue(item, hamster) {
  	return this.runTask(hamster, item[0], item[1], item[2], item[3], item[4]);
  }

  /**
  * @function grabHamster - Keeps track of threads running, scoped globally and to task
  * @param {number} threadId - Id of thread
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  */
  grabHamster(threadId, habitat) {
    if(habitat.persistence) {
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
    let newWheel = hamstersHabitat.selectHamsterWheel();
    if (hamstersHabitat.webWorker) {
      return new hamstersHabitat.SharedWorker(newWheel, 'SharedHamsterWheel');
    }
    return new hamstersHabitat.Worker(newWheel);
  }

  /**
  * @function prepareMeal - Prepares message to send to a thread and invoke execution
  * @param {object} threadArray - Provided data to execute logic on
  * @param {object} task - Provided library functionality options for this task
  * @return {object} hamsterFood - Prepared message to send to a thread
  */
  prepareMeal(threadArray, task) {
    let hamsterFood = {
    	array: threadArray
    };
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
  runTask(hamster, array, task, scope, resolve, reject) {
  	let threadId = this.running.length;
    let hamsterFood = this.prepareMeal(array, task);
    this.registerTask(task.id);
    this.keepTrackOfThread(task, threadId);
    if(scope.habitat.legacy) {
      scope.habitat.legacyWheel(hamsterFood, resolve, reject);
    } else {
      this.trainHamster(task.count, task, hamster, scope, resolve, reject);
      scope.data.feedHamster(hamster, hamsterFood, scope.habitat);
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
  hamsterWheel(array, task, scope, resolve, reject) {
    if(scope.maxThreads === this.running.length) {
      return this.addWorkToPending(array, task, scope, resolve, reject);
    }
    let hamster = this.grabHamster(this.running.length, scope.habitat);
    return this.runTask(hamster, array, task, scope, resolve, reject);
  }

  /**
  * @function returnOutputAndRemoveTask - gathers thread outputs into final result
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  */
  returnOutputAndRemoveTask(task, resolve) {
    let output = hamstersData.getOutput(task, hamstersHabitat.transferrable);
    if (task.sort) {
      output = hamstersData.sortOutput(output, task.sort);
    }
    this.tasks[task.id] = null; //Clean up our task, not needed any longer
    resolve({
      data: output
    });
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
  trainHamster(threadId, task, hamster, scope, resolve, reject) {
    let pool = this;
    // Handle successful response from a thread
    function onThreadResponse(message) {
      let results = message.data;
      pool.running.splice(pool.running.indexOf(threadId), 1); //Remove thread from running pool
    	task.workers.splice(task.workers.indexOf(threadId), 1); //Remove thread from task running pool
      // String only communcation for rn...in 2k18
      if(scope.habitat.reactNative) {
        task.output[threadId] = JSON.parse(results.data);
      } else {
        task.output[threadId] = results.data;
      }
      if (task.workers.length === 0 && task.count === task.threads) {
        pool.returnOutputAndRemoveTask(task, resolve);
      }
      if (pool.pending.length !== 0) {
        pool.processQueue(pool.pending.shift(), hamster);
      } else if (!scope.habitat.persistence && !scope.habitat.webWorker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    }
    // Handle error response from a thread
    function onThreadError(error) {
      hamstersLogger.errorFromThread(error, reject);
    }
    // Register on message/error handlers
    if (hamstersHabitat.webWorker) {
      hamster.port.onmessage = onThreadResponse;
      hamster.port.onmessageerror = onThreadError;
      hamster.port.onerror = onThreadError;
    } else {
      hamster.onmessage = onThreadResponse;
      hamster.onmessageerror = onThreadError;
      hamster.onerror = onThreadError;
    }
  }

  /**
  * @function scheduleTask - Adds new task to the system for execution
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Scaffold to execute login within
  * @param {number} maxThreads - Maximum number of threads for this client
  */
  scheduleTask(task, scope) {
  	return new Promise((resolve, reject) => {
      let threadArrays = [];
      if(task.input.array && task.threads !== 1) {
        threadArrays = scope.data.splitArrays(task.input.array, task.threads); //Divide our array into equal array sizes
      }
      let i = 0;
      while (i < task.threads) {
      	if(threadArrays && task.threads !== 1) {
        	this.hamsterWheel(threadArrays[i], task, scope, resolve, reject);
		    } else {
        	this.hamsterWheel(task.input.array, task, scope, resolve, reject);
		    }
        i += 1;
      }
    });
  }
}

var hamsterPool = new pool();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterPool;
}
