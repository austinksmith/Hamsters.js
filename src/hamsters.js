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

// Import core functionality
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
    this.run = this.hamstersRun;
    this.promise = this.hamstersPromise;
    this.await = this.hamstersAwait;
    this.wheel = this.pool.selectHamsterWheel();
    this.init = this.initializeLibrary;
  }

  initializeLibrary(startOptions) {
    this.logger.info(`Preparing the hamster wheels & readying hamsters`);
    if (typeof startOptions !== 'undefined') {
      this.processStartOptions(startOptions);
    }
    this.pool.spawnHamsters(this.persistence, this.wheel, this.maxThreads);
    delete this.init;
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

  legacyHamsterWheel(threadId, task, resolve, reject) {
    this.pool.trackThread(task, threadId);
    let dataArray = hamstersData.arrayFromIndex(task.input.array, task.indexes[threadId]);
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
    this.operator = scope.data.prepareJob(functionToRun, scope.habitat);
    this.memoize = params.memoize || false;
    this.dataType = params.dataType ? params.dataType.toLowerCase() : null;
    if(params.array && this.threads !== 1) {
      this.indexes = scope.data.determineSubArrays(params.array, this.threads);
    }
  }

  // async hamstersAwait(params, functionToRun) {
  //   let task = new this.hamstersTask(params, functionToRun, this);
  //   let results = null;
  //   try {
  //     results = await this.pool.scheduleTask(task, this.wheel, this.maxThreads);
  //     return results;
  //   } catch (error) {
  //     return this.logger.error(error.messsage);
  //   }
  // }

  hamstersPromise(params, functionToRun) {
    return new Promise((resolve, reject) => {
      let task = new this.hamstersTask(params, functionToRun, this);
      this.pool.scheduleTask(newTask, this.persistence, this.wheel, this.maxThreads).then(function(results) {
        resolve(results);
      }).catch(function(error) {
        hamstersLogger.error(error.messsage, reject);
      });
    });
  }

  hamstersRun(params, functionToRun, onSuccess, onError) {
    let newTask = new this.hamstersTask(params, functionToRun, this);
    this.pool.scheduleTask(newTask, this.persistence, this.wheel, this.maxThreads).then(function(results) {
      onSuccess(results);
    }).catch(function(error) {
      hamstersLogger.error(error.messsage, onError);
    });
  }
}

var hamsters = new hamstersjs();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsters;
}