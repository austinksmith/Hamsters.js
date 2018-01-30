/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

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
    this.queueWork = this.addWorkToPending;
    this.beginWork = this.startTask;
    this.fetchHamster = this.grabHamster;
    this.selectHamsterWheel = this.selectHamsterWheel;
    this.markThreadReady = this.removeThreadFromRunning;
    this.trackThread = this.keepTrackOfThread;
  }

  addWorkToPending(task, id, resolve, reject) {
  	this.pending.push({
  		item: task,
  		threadId: id,
  		promiseResolve: resolve,
  		promiseReject: reject
  	});
  }

  grabHamster(threadId, persistence, wheel) {
    if(persistence) {
      return this.threads[threadId];
    }
    return this.spawnHamster(hamstersHabitat, wheel, hamstersData.workerURI);
  }

  newTask(taskOptions) {
    let index = this.pool.tasks.push(taskOptions);
    return this.pool.tasks[(index - 1)];
  }

  startTask(task, resolve, reject) {
    return this.wheel(task, resolve, reject);
  }

  removeThreadFromRunning(task, id) {
    this.running.splice(this.running.indexOf(id), 1); //Remove thread from running pool
    task.workers.splice(task.workers.indexOf(id), 1); //Remove thread from task running pool
  }

  processQueue(hamster, item) {
    if (!item) {
      return;
    }
    this.wheel(item.input, item.params, item.aggregate, item.onSuccess, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
  }

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

  hamsterWheel(task, persistence, wheel, resolve, reject) {
    let threadId = this.running.length;
    if(this.maxThreads === threadId) {
      return this.queueWork(task, threadId, resolve, reject);
    }
    let hamsterFood = hamstersData.prepareMeal(task, threadId);
    let hamster = this.grabHamster(threadId, persistence, wheel);
    this.trainHamster(threadId, task, hamster, persistence, resolve, reject);
    this.trackThread(task, threadId);
    hamstersData.feedHamster(hamster, hamsterFood);
    task.count += 1; //Increment count, thread is running
  }

  returnOutputAndRemoveTask(task, resolve) {
    let output = hamstersData.getOutput(task, hamstersHabitat.transferrable);
    if (task.sort) {
      output = hamstersData.sortOutput(output, task.sort);
    }
    this.tasks[task.id] = null; //Clean up our task, not needed any longer
    resolve(output);
  }

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

  selectHamsterWheel() {
    if (hamstersHabitat.legacy) {
      return hamstersWheel.legacy;
    }
    if(hamstersHabitat.webWorker) {
      return hamstersWheel.worker;
    }
    return hamstersWheel.regular;
  }

  scheduleTask(task, persistence, wheel, maxThreads) {
  	if(this.running.length === maxThreads) {
  		return this.addWorkToPending(task);
  	}
  	return new Promise((resolve, reject) => {
      let i = 0;
      while (i < task.threads) {
        this.hamsterWheel(task, persistence, wheel, resolve, reject);
        i += 1;
      }
    });
  }
  
  keepTrackOfThread(task, id) {
    task.workers.push(id); //Keep track of threads poold to current task
    this.running.push(id); //Keep track of all currently running threads
  }
}

var hamsterPool = new pool();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterPool;
}
