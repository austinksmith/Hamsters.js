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
import hamstersHabitat from './core/habitat';
import hamstersPool from './core/pool';
import hamstersData from './core/data';
import hamstersWheel from './core/wheel';
import hamstersTools from './core/tools';
import hamstersLogger from './core/logger';
import hamstersMemoizer from './core/memoizer';

class hamstersjs {

  constructor() {
    this.persistence = true;
    this.memoize = false;
    this.atomics = false;
    this.debug = false;
    this.version = hamstersVersion;
    this.maxThreads = hamstersHabitat.logicalThreads;
    this.tools = hamstersTools;
    this.habitat = hamstersHabitat;
    this.data = hamstersData;
    this.pool = hamstersPool;
    this.logger = hamstersLogger;
    this.memoizer = hamstersMemoizer;
    this.run = this.runHamsters;
    this.promise = this.hamstersPromise;
    this.loop = this.loopAbstraction;
    this.wheel = hamstersPool.selectHamsterWheel();
    this.init = this.initializeLibrary;
  }

  initializeLibrary(startOptions) {
    this.logger.info(`Preparing the hamster wheels & readying hamsters`);
    if (typeof startOptions !== 'undefined') {
      this.processStartOptions(startOptions);
    }
    this.pool.spawnHamsters(this.persistence, this.wheel, this.maxThreads);
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

  newTask(taskOptions) {
    let index = this.pool.tasks.push(taskOptions);
    return this.pool.tasks[(index - 1)];
  }

  loopAbstraction(input, onSuccess) {
    let params = new hamstersLoop.options(input, this.habitat.webWorker);
    this.runHamsters(params, function(rtn) {
      onSuccess(rtn);
    }, input.threads, true, input.dataType);
  }

  legacyHamsterWheel(threadId, task, resolve, reject) {
    this.pool.trackThread(task, threadId);
    let dataArray = this.data.arrayFromIndex(task.input.array, task.indexes[threadId]);
    hamsterWheel.legacy(task, dataArray, resolve, reject);
    task.count += 1; //Thread finished
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

  runHamsters(params, functionToRun, onSuccess) {
    var task = new this.hamstersTask(params, functionToRun, this);
    var logger = this.logger;
    this.pool.scheduleTask(task, this.wheel, this.maxThreads).then(function(results) {
      onSuccess(results);
    }).catch(function(error) {
      logger.error(error.messsage);
    });
  }

  hamsterWheel(task, resolve, reject) {
    let threadId = this.pool.running.length;
    if(this.maxThreads === threadId) {
      return this.pool.queueWork(task, threadId, resolve, reject);
    }
    let hamsterFood = this.data.prepareMeal(task, threadId);
    let hamster = taskhis.pool.grabHamster(threadId, this.persistence, this.habitat, this.worker, this.data);
    this.trainHamster(threadId, task, hamster, resolve, reject);
    this.pool.trackThread(task, threadId);
    this.data.feedHamster(hamster, hamsterFood);
    task.count += 1; //Increment count, thread is running
  }

  returnOutput(task, resolve) {
    let output = this.data.getOutput(task, this.habitat.transferrable);
    if (task.sort) {
      output = this.data.sortOutput(output, task.sort);
    }
    this.pool.tasks[task.id] = null; //Clean up our task, not needed any longer
    resolve(output);
  }

  trainHamster(threadId, task, hamster, resolve, reject) {
    let scope = this;
    // Handle successful response from a thread
    function onThreadResponse(messsage) {
      let results = message.data;
      scope.pool.destroyThread(task, threadId);
      task.output[threadId] = results.data;
      if (task.workers.length === 0 && task.count === task.threads) {
        scope.returnOutput(task, resolve);
      }
      if (scope.pool.pending.length !== 0) {
        scope.pool.processQueue(scope.pool.pending.shift());
      }
      if (!scope.persistence && !scope.habitat.webWorker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    }
    // Handle error response from a thread
    function onThreadError(error) {
      this.logger.errorFromThread(error, reject);
    }
    // Register on message/error handlers
    if (this.habitat.webWorker) {
      hamster.port.onmessage = onThreadResponse;
      hamster.port.onerror = onThreadError;
    } else {
      hamster.onmessage = onThreadResponse;
      hamster.onerror = onThreadError;
    }
  }
}

var hamsters = new hamstersjs();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsters;
}