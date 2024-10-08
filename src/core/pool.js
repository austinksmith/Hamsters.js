/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class Pool {
	
  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor(hamsters) {
    'use strict';

    this.hamsters = hamsters;
    this.threads = new hamsters.observable([]);
    this.running = new hamsters.observable([]);
    this.pending = new hamsters.observable([]);
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
    if(this.hamsters.habitat.debug) {
      task.scheduler.metrics.threads[task.scheduler.count].enqueued_at = Date.now();
    }
    this.pending.push({
      index: index,
      count: task.scheduler.count,  
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
    if(this.hamsters.habitat.debug) {
      item.task.scheduler.metrics.threads[item.count].dequeued_at = Date.now();
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
    if(this.hamsters.habitat.persistence) {
      return this.threads.get(threadId);
    }
    return this.spawnHamster();
  }

  /**
  * @function keepTrackOfThread - Keeps track of threads running, scoped globally and to task
  * @param {object} task - Provided library functionality options for this task
  * @param {number} id - Id of thread to track
  */
  keepTrackOfThread(task, id) {
    // if(this.hamsters.habitat.debug) {
    //   task.scheduler.metrics.threads[id].started_at = Date.now();
    // }
    task.scheduler.workers.push(id); //Keep track of threads scoped to current task
    this.running.push(id); //Keep track of all currently running threads
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
  * @return {object} - New WebWorker thread using selected scaffold
  */
  spawnHamster() {
    const { selectHamsterWheel, Worker } = this.hamsters.habitat;
    const hamsterWheel = selectHamsterWheel();
    return new Worker(hamsterWheel);
  }

  /**
   * @function prepareMeal
   * @description Prepares message to send to a thread and invoke execution
   * @param {number} index - Index of the subarray to process
   * @param {number} subTaskId - Subtask ID
   * @param {object} task - Provided library functionality options for this task
   * @returns {object} - Prepared message to send to a thread
   */
  prepareMeal(index, task) {
    // Prepare the base hamsterFood object
    const hamsterFood = {
      array: task.input.array && task.input.array.length !== 0 ? 
            this.hamsters.data.getSubArrayFromIndex(index, task.input.array) : [],
      index: index
    };

    // Add sharedBuffer if it exists
    if (typeof task.scheduler.sharedBuffer !== 'undefined') {
      hamsterFood.sharedBuffer = task.scheduler.sharedBuffer;
    }

    // List of excluded keys
    const excludedKeys = new Set(['array', 'threads', 'sharedArray']);

    // Iterate over task.input properties and add to hamsterFood
    for (const key in task.input) {
      if (task.input.hasOwnProperty(key) && !excludedKeys.has(key)) {
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
  	let threadId = this.running.length();
    index.id = threadId;
    let hamsterFood = this.prepareMeal(index, task);
    this.keepTrackOfThread(task, threadId);
    if(this.hamsters.habitat.legacy) {
      this.hamsters.habitat.legacyWheel(this.hamsters.habitat, hamsterFood, resolve, reject);
    } else {
      this.hamsters.pool.trainHamster(index, task, threadId, hamster, resolve, reject);
      this.hamsters.data.feedHamster(hamster, hamsterFood);
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
    if(this.hamsters.habitat.maxThreads <= this.running.length()) {
      return this.addWorkToPending(index, task, resolve, reject);
    }
    let hamster = this.fetchHamster(this.running.length());
    return this.runTask(hamster, index, task, resolve, reject);
  }

  /**
  * @function returnOutputAndRemoveTask - Gathers thread outputs into final result
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  */
  returnOutputAndRemoveTask(task, resolve) {
    if(task.scheduler.sharedBuffer) {
      task.output = this.hamsters.data.processDataType(task.input.dataType, task.scheduler.sharedBuffer);
    }
    if(task.input.aggregate) {
      task.output = this.hamsters.data.aggregateThreadOutputs(task.output, task.input.dataType);
    }
    if(task.input.sort) {
      task.output = this.hamsters.data.sortOutput(task.output, task.input.sort)
    }
    if (this.hamsters.habitat.debug) {
      const completedAt = Date.now();
      const startedAt = task.scheduler.metrics.started_at;
      task.scheduler.metrics.completed_at = completedAt;
      console.info(`Hamsters.js Task Completed In ${completedAt - startedAt}ms`);
    }
    if(task.input.distribute) {
      resolve(task);
    } else {
      resolve(task.output);
    }
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
      this.hamsters.data.addThreadOutputWithIndex(task, index, output);
    } else {
      task.output = output;
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
  trainHamster(index, task, threadId, hamster, resolve, reject) {
    let onThreadResponse = (message) => {
      this.hamsters.pool.processReturn(this.hamsters.habitat, index, message, task);
      // if(this.hamsters.habitat.debug) {
      //   task.scheduler.metrics.threads[threadId].completed_at = Date.now();
      // }
      this.hamsters.pool.removeFromRunning(task, threadId);
      if (task.scheduler.workers.length === 0 && task.scheduler.count === task.scheduler.threads) {
        this.hamsters.pool.returnOutputAndRemoveTask(task, resolve);
      }
      if (this.hamsters.pool.pending.length() !== 0) {
        return this.hamsters.pool.processQueuedItem(hamster, this.hamsters.pool.pending.shift());
      }
      if(!this.hamsters.habitat.persistence) {
        return hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    };
    this.hamsters.pool.setOnMessage(hamster, onThreadResponse, this.hamsters.habitat, reject);
  }

  /**
  * @function scheduleTask - Adds new task to the system for execution
  * @param {object} task - Provided library functionality options for this task
  * @param {boolean} persistence - Whether persistence mode is enabled or not
  * @param {function} wheel - Scaffold to execute login within
  * @param {number} maxThreads - Maximum number of threads for this client
  */
  scheduleTask(task, resolve, reject) {
    // if(this.hamsters.habitat.debug) {
    //   let metrics = task.scheduler.metrics;
    //   metrics.started_at = Date.now();
    //   return new Promise((resolve, reject) => {
    //     while (i < task.scheduler.threads) {
    //       metrics.threads.push({
    //         created_at: Date.now(),
    //         started_at: null,
    //         enqueued_at: null,
    //         dequeued_at: null,
    //         completed_at: null
    //       });
    //       this.hamsterWheel(task.scheduler.indexes[i], task, resolve, reject);
    //       i += 1;
    //     }
    //   });
    // }
    //Process with debug mode disabled, no need for time stamping
  	// return new Promise((resolve, reject) => {
      if(task.input.distribute && task.type !== 'task-response') {
        this.hamsters.distribute.distributeTask(task, resolve, reject);
      } else {
        let i = 0;
        while (i < task.scheduler.threads) {
          this.hamsterWheel(task.scheduler.indexes[i], task, resolve, reject);
          i += 1;
        }
      }
    // });
  }
}

export default Pool;