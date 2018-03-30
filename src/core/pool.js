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
    this.selectHamsterWheel = this.selectHamsterWheel;
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
  processQueue(item) {
  	return this.runTask(item[0], item[1], item[2], item[3], item[4], item[5]);
  }

  /**
  * @function grabHamster - Keeps track of threads running, scoped globally and to task
  * @param {number} threadId - Id of thread
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  */
  grabHamster(threadId, persistence, wheel) {
    if(persistence) {
      return this.threads[threadId];
    }
    return this.spawnHamster(hamstersHabitat, wheel, hamstersData.workerURI);
  }

  /**
  * @function keepTrackOfThread - Keeps track of threads running, scoped globally and to task
  * @param {object} task - Provided library functionality options for this task
  * @param {number} id - Id of thread to track
  */
  keepTrackOfThread(task, id) {
    task.workers.push(id); //Keep track of threads poold to current task
    this.running.push(id); //Keep track of all currently running threads
  }

  /**
  * @function registerTask - Adds task to execution pool based on id
  * @param {number} id - Id of task to register
  */
  registerTask(id) {
    let index = this.tasks.push(id);
    return this.tasks[(index - 1)];
  }

  /**
  * @function spawnHamsters - Spawns multiple new threads for execution
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  * @param {number} maxThreds - Max number of threads for this client
  */
  spawnHamsters(persistence, wheel, maxThreads) {
  	let workerURI = null;
    if(hamstersHabitat.legacy) {
      return;
    }
    console.log(hamstersHabitat);
    if(hamstersHabitat.browser && !hamstersHabitat.reactNative) {
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
    if(hamstersHabitat.reactNative) {
      return new hamstersHabitat.Worker('./common/rnHamstersWheel.js');
    }
    if(hamstersHabitat.ie10) {
      return new hamstersHabitat.Worker('./common/hamstersWheel.js');
    }
    if (hamstersHabitat.node) {
      return new hamstersHabitat.Worker(wheel);
    }
    if (hamstersHabitat.webWorker) {
      return new hamstersHabitat.SharedWorker(workerURI, 'SharedHamsterWheel');
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
  * @function hamsterWheel - Runs function using thread
  * @param {object} array - Provided data to execute logic on
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Results from select hamster wheel
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  runTask(array, task, persistence, wheel, resolve, reject) {
  	let threadId = this.running.length;
    let hamsterFood = this.prepareMeal(array, task);
    this.registerTask(task.id);
    this.keepTrackOfThread(task, threadId);
    if(hamstersHabitat.legacy) {
      wheel(hamsterFood, resolve, reject);
    } else {
      let hamster = this.grabHamster(threadId, persistence, wheel);
      this.trainHamster(threadId, task, hamster, persistence, resolve, reject);
      hamstersData.feedHamster(hamster, hamsterFood);
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
  hamsterWheel(array, task, persistence, maxThreads, wheel, resolve, reject) {
    if(maxThreads === this.running.length) {
      return this.addWorkToPending(array, task, persistence, wheel, resolve, reject);
    }
    return this.runTask(array, task, persistence, wheel, resolve, reject);
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
  trainHamster(threadId, task, hamster, persistence, resolve, reject) {
    let pool = this;
    // Handle successful response from a thread
    function onThreadResponse(message) {
      let results = message.data;
      pool.running.splice(pool.running.indexOf(threadId), 1); //Remove thread from running pool
    	task.workers.splice(task.workers.indexOf(threadId), 1); //Remove thread from task running pool
      // String only communcation for rn...in 2k18
      if(hamstersHabitat.reactNative) {
        task.output[threadId] = JSON.parse(results.data);
      } else {
        task.output[threadId] = results.data;
      }
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
    let threadArrays = [];
	  if(task.input.array && task.threads !== 1) {
	    threadArrays = hamstersData.splitArrays(task.input.array, task.threads); //Divide our array into equal array sizes
	  }
  	return new Promise((resolve, reject) => {
      let i = 0;
      while (i < task.threads) {
      	if(threadArrays && task.threads !== 1) {
        	this.hamsterWheel(threadArrays[i], task, persistence, maxThreads, wheel, resolve, reject);
		    } else {
        	this.hamsterWheel(task.input.array, task, persistence, maxThreads, wheel, resolve, reject);
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
