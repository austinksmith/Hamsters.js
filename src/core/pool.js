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
    this.threads = [];
    this.running = [];
    this.pending = [];
    this.fetchHamster = this.getAvailableThread.bind(this);
  }

  /**
  * @function addWorkToPending - Adds task to queue waiting for available thread
  * @param {number} index - Index of the task
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  addWorkToPending(index, task, resolve, reject) {
    if (this.hamsters.habitat.debug) {
      task.scheduler.metrics.threads[task.scheduler.count].enqueued_at = Date.now();
    }
    this.pending.push({
      index,
      count: task.scheduler.count,  
      task,
      resolve,
      reject
    });
  }

  /**
  * @function processQueuedItem - Invokes processing of next item in queue
  * @param {object} hamster - The thread to run the task
  * @param {object} item - Task to process
  */
  processQueuedItem(hamster, item) {
    if (this.hamsters.habitat.debug) {
      item.task.scheduler.metrics.threads[item.count].dequeued_at = Date.now();
    }
    return this.runTask(hamster, item.index, item.task, item.resolve, item.reject);
  }

  /**
  * @function getAvailableThread - Gets an available thread
  * @param {number} threadId - Id of the thread
  * @returns {object} - The available thread
  */
  getAvailableThread(threadId) {
    if (this.hamsters.habitat.persistence) {
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
    if (this.hamsters.habitat.debug) {
      task.scheduler.metrics.threads[id].started_at = Date.now();
    }
    task.scheduler.workers.push(id);
    this.running.push(id);
  }

  /**
  * @function spawnHamsters - Spawns multiple new threads for execution
  * @param {number} maxThreads - Max number of threads for this client
  */
  spawnHamsters(maxThreads) {
    while (maxThreads--) {
      this.threads.push(this.spawnHamster());
    }
  }

  /**
  * @function spawnHamster - Spawns a new thread for execution
  * @return {object} - New WebWorker thread using selected scaffold
  */
  spawnHamster() {
    const { selectHamsterWheel, SharedWorker, Worker, node, parentPort } = this.hamsters.habitat;
    const hamsterWheel = selectHamsterWheel();
    if (this.hamsters.habitat.webWorker) {
      return new SharedWorker(hamsterWheel, 'SharedHamsterWheel');
    }
    if (node && typeof parentPort !== 'undefined') {
      return new Worker(hamsterWheel);
    }
    return new Worker(hamsterWheel);
  }

  /**
  * @function prepareMeal - Prepares message to send to a thread and invoke execution
  * @param {number} index - Index of the subarray to process
  * @param {object} task - Provided library functionality options for this task
  * @return {object} - Prepared message to send to a thread
  */
  prepareMeal(index, task) {
    const hamsterFood = { array: this.hamsters.data.getSubArrayFromIndex(index, task) };
    for (const key in task.input) {
      if (task.input.hasOwnProperty(key) && !['array', 'threads'].includes(key)) {
        hamsterFood[key] = task.input[key];
      }
    }
    return hamsterFood;
  }

  /**
  * @function runTask - Runs function using thread
  * @param {object} hamster - The thread to run the task
  * @param {number} index - Index of the subarray to process
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  runTask(hamster, index, task, resolve, reject) {
    const threadId = this.running.length;
    const hamsterFood = this.prepareMeal(index, task);
    this.keepTrackOfThread(task, threadId);
    if (this.hamsters.habitat.legacy) {
      this.hamsters.wheel.legacy(hamsterFood, resolve, reject);
    } else {
      this.trainHamster(index, task, threadId, hamster, resolve, reject);
      this.hamsters.data.feedHamster(hamster, hamsterFood);
    }
    task.scheduler.count += 1;
  }

  /**
  * @function hamsterWheel - Runs or queues function using threads
  * @param {number} index - Index of the subarray to process
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  hamsterWheel(index, task, resolve, reject) {
    if (this.hamsters.habitat.maxThreads <= this.running.length) {
      return this.addWorkToPending(index, task, resolve, reject);
    }
    const hamster = this.fetchHamster(this.running.length);
    return this.runTask(hamster, index, task, resolve, reject);
  }

  /**
  * @function returnOutputAndRemoveTask - Gathers thread outputs into final result
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  */
  returnOutputAndRemoveTask(task, resolve) {
    if (this.hamsters.habitat.debug) {
      task.scheduler.metrics.completed_at = Date.now();
      console.info("Hamsters.js Task Completed: ", task);
    }
    resolve(task.sort ? this.hamsters.data.sortOutput(task.output, task.sort) : task.output);
  }

  /**
  * @function removeFromRunning - Removes a thread from the running pool
  * @param {object} task - Provided library functionality options for this task
  * @param {number} threadId - Id of the thread to remove
  */
  removeFromRunning(task, threadId) {
    this.running.splice(this.running.indexOf(threadId), 1);
    task.scheduler.workers.splice(task.scheduler.workers.indexOf(threadId), 1);
  }

  /**
  * @function processReturn - Processes the returned message from a thread
  * @param {object} habitat - Habitat configuration
  * @param {number} index - Index of the subarray processed
  * @param {object} message - Message returned from the thread
  * @param {object} task - Provided library functionality options for this task
  */
  processReturn(index, message, task) {
    let output = message.data;
    if (this.hamsters.habitat.reactNative) {
      output = JSON.parse(message).data;
    } else if (message.data.data !== undefined) {
      output = message.data.data;
    }
    if (task.scheduler.threads !== 1) {
      this.hamsters.data.addThreadOutputWithIndex(task, index, output);
    } else {
      task.output = output;
    }
  }

  /**
  * @function setOnMessage - Sets the message handlers for a thread
  * @param {object} hamster - The thread to set the handlers on
  * @param {function} onThreadResponse - Handler for thread response
  * @param {object} habitat - Habitat configuration
  * @param {function} reject - onError method
  */
  setOnMessage(hamster, onThreadResponse, reject) {
    if (this.hamsters.habitat.webWorker) {
      hamster.port.onmessage = onThreadResponse;
      hamster.port.onmessageerror = reject;
      hamster.port.onerror = reject;
    } else if (this.hamsters.habitat.node) {
      hamster.once('message', onThreadResponse);
      hamster.once('onmessageerror', reject);
      hamster.once('error', reject);
    } else {
      hamster.onmessage = onThreadResponse;
      hamster.onmessageerror = reject;
      hamster.onerror = reject;
    }
  }

  /**
  * @function trainHamster - Trains thread in how to behave
  * @param {number} index - Index of the subarray to process
  * @param {object} task - Provided library functionality options for this task
  * @param {number} threadId - Id of the thread to train
  * @param {object} hamster - The thread to train
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  trainHamster(index, task, threadId, hamster, resolve, reject) {
    const onThreadResponse = (message) => {
      this.hamsters.pool.processReturn(index, message, task);
      if (this.hamsters.habitat.debug) {
        task.scheduler.metrics.threads[threadId].completed_at = Date.now();
      }
      this.hamsters.pool.removeFromRunning(task, threadId);
      if (task.scheduler.workers.length === 0 && task.scheduler.count === task.scheduler.threads) {
        this.hamsters.pool.returnOutputAndRemoveTask(task, resolve);
      }
      if (this.hamsters.pool.pending.length !== 0) {
        return pool.processQueuedItem(hamster, pool.pending.shift());
      }
      if (!this.hamsters.habitat.persistence) {
        return hamster.terminate();
      }
    };
    this.hamsters.pool.setOnMessage(hamster, onThreadResponse, reject);
  }

  /**
  * @function scheduleTask - Adds new task to the system for execution
  * @param {object} task - Provided library functionality options for this task
  */
  scheduleTask(task) {
    let i = 0;
    if(this.hamsters.habitat.debug) {
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

module.exports = Pool;
