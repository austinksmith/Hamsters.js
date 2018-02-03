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
import hamstersWheel from './wheel';
import hamstersLogger from './logger';

'use strict';

class pool {

  constructor() {
    this.tasks = [];
	  this.threads = [];
    this.running = [];
    this.pending = [];
    this.fetchHamster = this.grabHamster;
    this.selectHamsterWheel = this.selectHamsterWheel;
  }

  // addWorkToPending(task, id, resolve, reject) {
  // 	this.pending.push({
  // 		item: task,
  // 		threadId: id,
  // 		promiseResolve: resolve,
  // 		promiseReject: reject
  // 	});
  // }


  // processQueue(hamster, item) {
  //   if (!item) {
  //     return;
  //   }
  //   this.wheel(item.input, item.params, item.aggregate, item.onSuccess, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
  // }

  grabHamster(threadId, persistence, wheel) {
    if(persistence) {
      return this.threads[threadId];
    }
    return this.spawnHamster(hamstersHabitat, wheel, hamstersData.workerURI);
  }

  keepTrackOfThread(task, id) {
    task.workers.push(id); //Keep track of threads poold to current task
    this.running.push(id); //Keep track of all currently running threads
  }

  registerTask(id) {
    let index = this.tasks.push(id);
    return this.tasks[(index - 1)];
  }

  /**
  * @function spawnHamsters - Spawns multiple new threads for execution
  * @param {boolean} persistence - Results from select hamster wheel
  * @param {function} wheel - Results from select hamster wheel
  * @param {number} maxThreds - Max number of threads for this client
  */
  spawnHamsters(persistence, wheel, maxThreads) {
  	let workerURI = null;
    if(hamstersHabitat.legacy) {
      return;
    }
    if(hamstersHabitat.browser) {
      workerURI = hamstersData.generateBlob(wheel);
    }
    if (persistence) {
      hamstersLogger.info(`${maxThreads} Logical Threads Detected, Spawning ${maxThreads} Hamsters`);
      for (maxThreads; maxThreads > 0; maxThreads--) {
        this.threads.push(this.spawnHamster(wheel, workerURI));
      }
      hamstersLogger.info(`${this.threads.length} hamsters ready and awaiting instructions`);
    }
  }

  /**
  * @function spawnHamster - Spawns a new thread for execution
  * @param {function} wheel - Results from select hamster wheel
  * @param {string} workerURI - URI for created library blob object 
  */
  spawnHamster(wheel, workerURI) {
    if (hamstersHabitat.ie10) {
      return new hamstersHabitat.Worker(wheel);
    }
    if (hamstersHabitat.webWorker) {
      return new hamstersHabitat.SharedWorker(workerURI, 'SharedHamsterWheel');
    }
    if ((hamstersHabitat.node || hamstersHabitat.reactNative) && !hamstersHabitat.browser) {
      return new hamstersHabitat.Worker(wheel);
    }
    return new hamstersHabitat.Worker(workerURI);
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
      if (task.input.hasOwnProperty(key) && ['array', 'threads'].indexOf(key) == -1) {
        hamsterFood[key] = task.input[key];
      }
    }
    return hamsterFood;
  }

  /**
  * @function hamsterWheel - Runs function using threads
  * @param {object} array - Provided library functionality options for this task
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  hamsterWheel(array, task, persistence, wheel, resolve, reject) {
    let threadId = this.running.length;
    if(this.maxThreads === threadId) {
      return this.addWorkToPending(array, task, threadId, resolve, reject);
    }
    let hamster = this.grabHamster(threadId, persistence, wheel);
    this.trainHamster(threadId, task, hamster, persistence, resolve, reject);
    this.registerTask(task.id);
    this.keepTrackOfThread(task, threadId);
    hamstersData.feedHamster(hamster, this.prepareMeal(array, task));
    task.count += 1; //Increment count, thread is running
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
    resolve(output);
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
  trainHamster(threadId, task, hamster, persistence, resolve, reject) {
    let pool = this;
    // Handle successful response from a thread
    function onThreadResponse(message) {
      let results = message.data;
      pool.running.splice(pool.running.indexOf(threadId), 1); //Remove thread from running pool
    	task.workers.splice(task.workers.indexOf(threadId), 1); //Remove thread from task running pool
      task.output[threadId] = results.data; // Save results data to output
      if (task.workers.length === 0 && task.count === task.threads) {
        pool.returnOutputAndRemoveTask(task, resolve);
      }
      if (pool.pending.length !== 0) {
        pool.processQueue(pool.pending.shift());
      }
      if (!persistence && !hamstersHabitat.webWorker) {
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
      hamster.port.onerror = onThreadError;
    } else {
      hamster.onmessage = onThreadResponse;
      hamster.onerror = onThreadError;
    }
  }

  /**
  * @function scheduleTask - Determines which scaffold to use for proper execution for various environments
  */
  selectHamsterWheel() {
    if (hamstersHabitat.legacy) {
      return hamstersWheel.legacy;
    }
    if(hamstersHabitat.webWorker) {
      return hamstersWheel.worker;
    }
    return hamstersWheel.regular;
  }

  /**
  * @function scheduleTask - Adds new task to the system for execution
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Scaffold to execute login within
  * @param {number} maxThreads - Maximum number of threads for this client
  */
  scheduleTask(task, persistence, wheel, maxThreads) {
  	if(this.running.length === maxThreads) {
  		return this.addWorkToPending(task, persistence, wheel, resolve, reject);
  	}
  	let threadArrays = [];
	  if(task.input.array && task.threads !== 1) {
	    threadArrays = hamstersData.splitArrays(task.input.array, task.threads); //Divide our array into equal array sizes
	  }
  	return new Promise((resolve, reject) => {
      let i = 0;
      while (i < task.threads) {
      	if(threadArrays && task.threads !== 1) {
        	this.hamsterWheel(threadArrays[i], task, persistence, wheel, resolve, reject);
		    } else {
        	this.hamsterWheel(task.input.array, task, persistence, wheel, resolve, reject);
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
