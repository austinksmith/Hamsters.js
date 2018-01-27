/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

/* jshint esversion: 6 */

'use strict';

class pool {
  constructor() {
    this.tasks = [];
	  this.threads = [];
    this.running = [];
    this.pending = [];
    this.queueWork = this.addWorkToPending;
    this.selectWheel = this.selectHamsterWheel;
  }

  addWorkToPending(task, id, resolve, reject) {
  	this.pending.push({
  		item: task,
  		threadId: id,
  		promiseResolve: resolve,
  		promiseReject: reject
  	});
  }

  processQueue(hamster, item) {
    if (!item) {
      return;
    }
    this.wheel(item.input, item.params, item.aggregate, item.onSuccess, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
  }

  startTask(task, resolve, reject) {
    return this.wheel(task, resolve, reject);
  }

  spawnHamsters(core) {
    if (core.habitat.legacy) {
      return;
    }
    if (core.habitat.browser) {
      core.data.workerURI = core.data.generateBlob(core.worker);
    }
    if (core.persistence) {
      let i = core.maxThreads;
      core.logger.info(`${i} Logical Threads Detected, Spawning ${i} Hamsters`);
      for (i; i > 0; i--) {
        core.pool.threads.push(this.spawnHamster());
      }
    }
  }

  spawnHamster(habitat, worker, workerURI) {
    if (this.habitat.ie10) {
      return new this.habitat.Worker(this.worker);
    }
    if (this.habitat.reactNative) {
      return new this.habitat.Worker(this.worker);
    }
    if (this.habitat.webWorker) {
      return new this.habitat.SharedWorker(this.data.workerURI, 'SharedHamsterWheel');
    }
    if (this.habitat.node || this.habitat.reactNative) {
      return new this.habitat.Worker(this.worker);
    }
    return new this.habitat.Worker(this.data.workerURI);
  }

  selectHamsterWheel(habitat, hamsterWheel) {
    if (habitat.legacy) {
      return hamsterWheel.legacy;
    }
    if(habitat.webWorker) {
      return hamsterWheel.worker;
    }
    return hamsterWheel.regular;
  }

  scheduleTask(task, wheel, maxThreads) {
  	if(this.running.length === maxThreads) {
  		return this.addWorkToPending()
  	}
  	return new Promise((resolve, reject) => {
      let i = 0;
      while (i < task.threads) {
        wheel(task, resolve, reject);
        i += 1;
      }
    });
  }
}

var hamsterPool = new pool();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterPool;
}
