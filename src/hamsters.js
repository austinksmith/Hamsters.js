/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

'use strict';

import hamstersVersion from './core/version';
import hamstersHabitat from './core/habitat';
import hamstersPool from './core/pool';
import hamstersData from './core/data';
import hamstersLogger from './core/logger';

class hamstersjs {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.version = hamstersVersion;
    this.init;
    this.habitat = hamstersHabitat;
    this.data = hamstersData;
    this.pool = hamstersPool;
    this.logger = hamstersLogger;
    this.run = this.hamstersRun.bind(this);
    this.promise = this.hamstersPromise.bind(this);
  }

  /**
  * @function initializeLibrary - Prepares & initializes Hamsters.js library
  * @param {object} startOptions - Provided library functionality options
  */
  init(startOptions) {
    this.processStartOptions(startOptions);
    if(!this.habitat.legacy && this.habitat.persistence === true) {
      hamstersPool.spawnHamsters(this.habitat.maxThreads);
    }
    this.maxThreads = this.habitat.maxThreads;
    hamstersLogger.info(`Initialized using up to ${this.habitat.maxThreads} threads.`);
  }

  /**
  * @function processStartOptions - Adjusts library functionality based on provided options
  * @param {object} startOptions - Provided library functionality options
  */
  processStartOptions(startOptions) {
    if (typeof startOptions !== 'undefined') {
      for (var key of Object.keys(startOptions)) {
        if (this.habitat.keys.indexOf(key.toLowerCase()) !== -1) {
          this.habitat[key] = startOptions[key];
        } else {
          this[key] = startOptions[key];
        }
      }
    }
    // Ensure legacy mode is disabled when we pass a third party worker library
    var forceLegacyMode = (typeof startOptions !== 'undefined' && typeof startOptions.legacy !== 'undefined');
    if(forceLegacyMode) {
      forceLegacyMode = startOptions.legacy;
    }
    if(typeof this.habitat['Worker'] === 'function' && !forceLegacyMode) {
      this.habitat.legacy = this.habitat.isIE;
    }
  }

  /**
  * @constructor
  * @function hamstersTask - Constructs a new task object from provided arguments
  * @param {object} params - Provided library execution options
  * @param {function} functionToRun - Function to execute
  * @return {object} new Hamsters.js task
  */
  hamstersTask(params, functionToRun) {
    if(this.habitat.legacy && !this.habitat.node && !this.habitat.isIE) {
      params.hamstersJob = functionToRun;
    } else {
      params.hamstersJob = this.data.prepareFunction(functionToRun);
    }
    let taskThreads = ((!this.habitat.legacy && params.threads) ? params.threads : 1);
    let indexes = params.indexes;
    if(taskThreads !== 1 && !indexes) {
      indexes = this.data.getSubArrayIndexes(params.array, taskThreads);
    }
    return {
      id: this.pool.tasks.length,
      count: 0,
      threads: taskThreads,
      workers: [],
      indexes: (indexes ? indexes : [{}]),
      memoize: (params.memoize ? params.memoize : false),
      dataType: (params.dataType ? params.dataType : null),
      input: params
    };
  }

  scheduleTask(task, resolve, reject) {
    return this.pool.scheduleTask(task).then((results) => {
      resolve(results);
    }).catch((error) => {
      this.logger.error(error.messsage, reject);
    });
  }

  /**
  * @async
  * @function hamstersPromise - Calls library functionality using async promises
  * @param {object} params - Provided library execution options
  * @param {function} functionToRun - Function to execute
  * @return {array} Results from functionToRun.
  */
  hamstersPromise(params, functionToRun) {
    return new Promise((resolve, reject) => {
      this.scheduleTask(this.hamstersTask(params, functionToRun), resolve, reject);
    });
  }

  /**
  * @async
  * @function hamstersRun - Calls library functionality using async callbacks
  * @param {object} params - Provided library execution options
  * @param {function} functionToRun - Function to execute
  * @param {function} onSuccess - Function to call upon successful execution
  * @param {function} onError - Function to call upon execution failure
  * @return {array} Results from functionToRun.
  */
  hamstersRun(params, functionToRun, onSuccess, onError) {
    this.scheduleTask(this.hamstersTask(params, functionToRun), onSuccess, onError);
  }
}

var hamsters = new hamstersjs();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsters;
}