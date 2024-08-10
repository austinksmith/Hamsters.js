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
  addWorkToPending(index, hamsterFood, task, resolve, reject) {
    if (this.hamsters.habitat.debug) {
      task.scheduler.metrics.threads[task.scheduler.count].enqueued_at = Date.now();
    }
    this.pending.push({
      index,
      hamsterFood,  
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
      item.task.scheduler.metrics.threads[item.index.id].dequeued_at = Date.now();
    }
    return this.runTask(hamster, item.index, item.hamsterFood, item.task, item.resolve, item.reject);
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
   * @function prepareMeal
   * @description Prepares message to send to a thread and invoke execution
   * @param {number} index - Index of the subarray to process
   * @param {number} subTaskId - Subtask ID
   * @param {object} task - Provided library functionality options for this task
   * @returns {object} - Prepared message to send to a thread
   */
  prepareMeal(index, subTaskId, task) {
    index.id = subTaskId;

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
  * @function runDistributedTask - Runs incoming distributed function using thread
  * @param {object} incomingMessage - The incoming subTask object
  */
  runDistributedTask(incomingMessage, targetClient) {
    const hamster = this.fetchHamster(this.running.length);
    let task = incomingMessage.task;
    let index = incomingMessage.hamsterFood.index;
    let handleResponse = this.hamsters.distribute.returnDistributedOutput;
    task.targetClient = targetClient;
    task.messageId = incomingMessage.messageId;
    task.isReply = true;

    this.runTask(hamster, index, incomingMessage.hamsterFood, incomingMessage.task, handleResponse, handleResponse);
  }



  /**
  * @function runTask - Runs function using thread
  * @param {object} hamster - The thread to run the task
  * @param {number} index - Index of the subarray to process
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  * @param {function} reject - onError method
  */
  runTask(hamster, index, hamsterFood, task, resolve, reject) {
    const threadId = this.running.length;
    this.hamsters.pool.keepTrackOfThread(task, threadId);
    if (this.hamsters.habitat.legacy) {
      this.hamsters.wheel.legacy(hamsterFood, resolve, reject);
    } else {
      this.hamsters.pool.trainHamster(index, task, threadId, hamster, resolve, reject);
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
  hamsterWheel(index, subTaskId, task, resolve, reject) {
    const hamsterFood = this.prepareMeal(index, subTaskId, task);
    if (this.hamsters.habitat.maxThreads <= this.running.length) {
      this.addWorkToPending(index, hamsterFood, task, resolve, reject);
    } else {
      if(task.input.distribute) {
        this.hamsters.distribute.distributeTask(task, hamsterFood, resolve, reject);
      } else {
        const hamster = this.fetchHamster(this.running.length);
        this.runTask(hamster, index, hamsterFood, task, resolve, reject);
      }
    }
  }

  processDistributedReturn(data) {
    debugger;
  }

  /**
  * @function returnOutputAndRemoveTask - Gathers thread outputs into final result
  * @param {object} task - Provided library functionality options for this task
  * @param {function} resolve - onSuccess method
  */
  returnOutputAndRemoveTask(task, resolve) {
    if(task.scheduler.sharedBuffer) {
      task.output = hamsters.data.processDataType(task.input.dataType, task.scheduler.sharedBuffer);
    }
    if(task.input.aggregate) {
      task.output = this.hamsters.data.aggregateThreadOutputs(task.output, task.input.dataType);
    }
    if(task.input.sort) {
      task.output = this.hamsters.data.sortOutput(task.output, task.input.sort)
    }
    if (this.hamsters.habitat.debug) {
      task.scheduler.metrics.completed_at = Date.now();
      console.info("Hamsters.js Task Completed: ", task);
    }
    if(task.input.distribute) {
      resolve(task);
    } else {
      resolve(task.output);
    }
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
   * @param {number} index - Index of the subarray processed
   * @param {object} message - Message returned from the thread
   * @param {object} task - Provided library functionality options for this task
   */
  processReturn(index, message, task) {
    const isReactNative = this.hamsters.habitat.reactNative;
    const isNode = this.hamsters.habitat.node;
    const response = message.data;
    const messageData = isReactNative ? JSON.parse(message).data : (response.data !== undefined ? response.data : response);
    const threadId = isNode ? message.index.id : response.index.id;

    if (task.scheduler.threads !== 1) {
      if (isReactNative || task.input.mixedOutput) {
          task.output[threadId] = messageData;
      } else {
        this.hamsters.data.addThreadOutputWithIndex(task, index, messageData);
      }
    } else {
      task.output = messageData;
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
      if (!this.hamsters.habitat.persistence) {
        hamster.terminate();
      }
      if (this.hamsters.pool.pending.length !== 0) {
        const queueHamster = this.hamsters.pool.fetchHamster(this.hamsters.pool.running.length);
        this.hamsters.pool.processQueuedItem(queueHamster, this.hamsters.pool.pending.shift());
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
  	return new Promise((resolve, reject) => {
      if(this.hamsters.debug) {
        task.scheduler.metrics.started_at = Date.now();
      }
      while (i < task.scheduler.threads) {
        this.hamsterWheel(task.scheduler.indexes[i], i, task, resolve, reject);
        i += 1;
      }
    });
  }
}

module.exports = Pool;