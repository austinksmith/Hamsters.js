/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/*
 * Title: Hamsters.js
 * Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library
 * Author: Austin K. Smith
 * Contact: austin@asmithdev.com
 * Copyright: 2015 Austin K. Smith - austin@asmithdev.com
 * License: Artistic License 2.0
 */

'use strict';

import hamstersVersion from './core/version';
import hamsterHabitat from './core/habitat';
import hamsterPool from './core/pool';
import hamsterData from './core/data';
import hamsterWheel from './core/wheel';
import hamsterTools from './core/tools';
import hamsterLogger from './core/logger';
import hamsterMemoizer from './core/memoizer';

class hamstersjs {

  constructor() {
    this.persistence = true;
    this.memoize = false;
    this.atomics = false;
    this.debug = false;
    this.version = hamstersVersion;
    this.maxThreads = hamsterHabitat.logicalThreads;
    this.tools = hamsterTools;
    this.habitat = hamsterHabitat;
    this.data = hamsterData;
    this.pool = hamsterPool;
    this.logger = hamsterLogger;
    this.memoizer = hamsterMemoizer;
    this.run = this.runHamsters;
    this.promise = this.hamstersPromise;
    this.ball = this.hamstersLoop;
    this.wheel = hamsterPool.selectWheel();
    this.init = this.initializeLibrary;
  }

  initializeLibrary(startOptions) {
    this.logger.info(`Preparing the hamster wheels & readying hamsters`);
    if (typeof startOptions !== 'undefined') {
      this.processStartOptions(startOptions);
    }
    if (this.habitat.browser && !this.habitat.reactNative) {
      this.setupBrowserSupport();
    }
    if (this.habitat.webWorker && typeof this.habitat.SharedWorker !== 'undefined') {
      this.setupWorkerSupport();
    }
    this.greaseHamsterWheel();
    this.pool.spawnHamsters(this.habitat, this);
    this.logger.info(`${this.maxThreads} hamsters ready and awaiting instructions`);
  }

  processStartOptions(startOptions) {
    let habitatKeys = ['worker', 'sharedWorker', 'legacy'];
    for (var key in startOptions) {
      if (startOptions.hasOwnProperty(key)) {
        if (habitatKeys.indexOf(key.toLowerCase()) !== -1) {
          hamsters.habitat[key] = startOptions[key];
        } else {
          hamsters[key] = startOptions[key];
        }
      }
    }
  }

  setupBrowserSupport() {
    let isIE10 = this.habitat.isIE(10);
    let userAgent = navigator.userAgent;
    let lacksWorkerSupport = typeof this.habitat.Worker === 'undefined';
    let legacyAgents = ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'];
    if (lacksWorkerSupport || legacyAgents.indexOf(userAgent) !== -1 || isIE10) {
      this.habitat.legacy = true;
    }
  }

  setupWorkerSupport() {
    try {
      let workerBlob = this.data.generateBlob();
      let SharedHamster = new this.habitat.SharedWorker(workerBlob, 'SharedHamsterWheel');
      this.data.workerURI = workerBlob;
    } catch (e) {
      this.habitat.legacy = true;
    }
  }

  newTask(taskOptions) {
    this.pool.tasks.push(taskOptions);
    return this.pool.tasks[taskOptions.id];
  }

  legacyHamsterWheel(thread_id, task, resolve, reject) {
    // this.trackThread(task, thread_id);
    var dataArray = this.data.arrayFromIndex(task.input.array, task.indexes[thread_id]);
    hamsterWheel.legacy(task, dataArray, resolve, reject);
    task.count += 1; //Thread finished
  }

  hamstersLoop(input, onSuccess) {
    let params = {
      init: input.startIndex || 0,
      limit: input.limit || null,
      array: input.array,
      incrementBy: input.incrementBy || 1,
      dataType: input.dataType || null,
      worker: this.habitat.webWorker
    };
    this.runHamsters(params, function() {
      let operator = params.run;
      if (typeof operator === "string") {
        if (params.worker) {
          operator = eval("(" + operator + ")");
        } else {
          operator = new Function(operator);
        }
      }
      if (!params.limit) {
        params.limit = params.array.length;
      }
      var i = params.init;
      for (i; i < params.limit; i += params.incrementBy) {
        rtn.data[i] = operator(params.array[i]);
      }
    }, function(rtn) {
      onSuccess(rtn);
    }, input.threads, 1, input.dataType);
  }

  hamstersTask(params, functionToRun, scope) {
    this.id = scope.pool.tasks.length;
    this.threads = params.threads || 1;
    this.count = 0;
    this.input = params;
    this.aggregate = params.aggregate || true;
    this.output = [];
    this.workers = [];
    this.operator = scope.data.prepareJob(functionToRun);
    this.memoize = params.memoize || false;
    this.dataType = params.dataType ? params.dataType.toLowerCase() : null;
    if(params.array) {
      this.indexes = scope.data.determineSubArrays(params.array, this.threads);
    }
  }

  hamstersPromise(params, functionToRun) {
    return new Promise((resolve, reject) => {
      var task = new this.hamstersTask(params, functionToRun, this);
      var logger = this.logger;
      this.pool.scheduleTask(task, this.wheel, this.maxThreads).then(function(results) {
        resolve(results);
      }).catch(function(error) {
        logger.error(error.messsage, reject);
      });
    });
  }

  runHamsters(params, functionToRun, onSuccess, numberOfWorkers, aggregate, dataType, memoize, sortOrder) {
    // Convert old arguments into new params object
    params.threads = params.threads || numberOfWorkers;
    params.aggregate = params.aggregate || aggregate || true;
    params.dataType = params.dataType || dataType;
    params.memoize = params.memoize || memoize || false;
    params.sort = params.sort || sortOrder;
    // Create new task and execute
    var task = new this.hamstersTask(params, functionToRun, this);
    var logger = this.logger;
    this.pool.scheduleTask(task, this.wheel, this.maxThreads).then(function(results) {
      onSuccess(results);
    }).catch(function(error) {
      logger.error(error.messsage);
    });
  }

  startTask(task, resolve, reject) {
    return this.wheel(task, startTime, resolve, reject);
  }

  hamsterWheel(task, resolve, reject) {
    let threadId = this.pool.running.length;
    if(this.maxThreads === threadId) {
      return this.pool.queueWork(task, threadId, resolve, reject);
    }
    let hamsterFood = this.data.prepareMeal(task, threadId);
    let hamster;
    if(this.persistence) {
      hamster = this.pool.threads[threadId];
    } else {
      hamster = this.pool.spawnHamster(this.habitat, this.worker, this.data.workerURI);
    }
    this.trainHamster(threadId, task, hamster, resolve, reject);
    this.trackThread(task, threadId);
    this.data.feedHamster(hamster, hamsterFood);
    task.count += 1; //Increment count, thread is running
  }

  trainHamster(threadId, task, hamster, resolve, reject) {
    var scope = this;
    // Handle successful response from a thread
    let onThreadResponse = function(e) {
      var results = e.data;
      scope.chewThread(task, threadId);
      task.output[threadId] = results.data;
      if (task.workers.length === 0 && task.count === task.threads) {
        var output = scope.data.getOutput(task, scope.habitat.transferrable);
        if (task.sort) {
          output = scope.data.sortOutput(output, task.sort);
        }
        resolve(output);
        scope.pool.tasks[task.id] = null; //Clean up our task, not needed any longer
      }
      if (scope.pool.pending.length !== 0) {
        scope.pool.processQueue(hamster, scope.pool.pending.shift());
      } else if (!scope.persistence && !scope.habitat.webWorker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    };

    // Handle error response from a thread
    let onThreadError = function(e) {
      if (!scope.habitat.webWorker) {
        hamster.terminate(); //Kill the thread
      }
      var error = {
        timeStamp: Date.now(),
        threadId: threadId,
        message: `Line ${e.lineno} in ${e.filename}: ${e.message}`
      };
      scope.pool.errors.push(error);
      reject(error);
    };

    if (this.habitat.webWorker) {
      hamster.port.onmessage = onThreadResponse;
      hamster.port.onerror = onThreadError;
    } else {
      hamster.onmessage = onThreadResponse;
      hamster.onerror = onThreadError;
    }
  }

  trackInput(inputArray, thread_id, task, hamsterFood) {
    task.input.push({
      input: inputArray,
      workerid: thread_id,
      taskid: task.id,
      params: hamsterFood,
      start: Date.now()
    });
  }

  trackThread(task, id) {
    task.startTime = Date.now();
    task.workers.push(id); //Keep track of threads scoped to current task
    this.pool.running.push(id); //Keep track of all currently running threads
  }

  chewThread(task, id) {
    this.pool.running.splice(this.pool.running.indexOf(id), 1); //Remove thread from running pool
    task.workers.splice(task.workers.indexOf(id), 1); //Remove thread from task running pool
  }

}

var hamsters = new hamstersjs();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsters;
}