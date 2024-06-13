/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import Habitat from './core/habitat';
import Pool from './core/pool';
import Data from './core/data';
import Wheel from './core/wheel';

class hamstersjs {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    'use strict';

    this.version = '5.5.4';
    this.run = this.hamstersRun.bind(this);
    this.promise = this.hamstersPromise.bind(this);
    this.init = this.inititializeLibrary.bind(this);
    this.data = {};
    this.pool = {};
    this.wheel = {};
    this.habitat = {};
  }

  /**
  * @function inititializeLibrary - Prepares & initializes Hamsters.js library
  * @param {object} startOptions - Provided library functionality options
  */
  inititializeLibrary(startOptions) {
    this.data = new Data(this);
    this.pool = new Pool(this);
    this.wheel = new Wheel(this);
    this.habitat = new Habitat(this);
    this.processStartOptions(startOptions);
    if (!this.habitat.legacy && this.habitat.persistence === true) {
      this.pool.spawnHamsters(this.habitat.maxThreads);
    }
    this.maxThreads = this.habitat.maxThreads;
    console.info(`Hamsters.js ${this.version} initialized using up to ${this.habitat.maxThreads} threads`);
  }

  /**
  * @function processStartOptions - Adjusts library functionality based on provided options
  * @param {object} startOptions - Provided library functionality options
  */
  processStartOptions(startOptions) {
    if (typeof startOptions !== 'undefined') {
      for (const key of Object.keys(startOptions)) {
        if (this.habitat.keys.includes(key.toLowerCase())) {
          this.habitat[key] = startOptions[key];
        } else {
          this[key] = startOptions[key];
        }
      }
    }
    // Ensure legacy mode is disabled when we pass a third party worker library
    let forceLegacyMode = (typeof startOptions !== 'undefined' && typeof startOptions.legacy !== 'undefined');
    if (forceLegacyMode) {
      forceLegacyMode = startOptions.legacy;
    }
    if (typeof this.habitat.Worker === 'function' && !forceLegacyMode) {
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
    params.array = params.array || [];
    const task = {
      input: {},
      output: [],
      scheduler: {
        count: 0,
        threads: params.threads || 1,
        workers: []
      }
    };

    if (this.habitat.legacy) {
      task.scheduler.threads = 1;
      if (!this.habitat.node && !this.habitat.isIE) {
        params.hamstersJob = functionToRun;
      }
    } else {
      params.hamstersJob = this.habitat.legacy ? functionToRun : this.data.prepareFunction(functionToRun);
      if (params.sharedArray && this.habitat.atomics) {
        task.scheduler.indexes = params.indexes || this.data.getSubArrayIndexes(params.sharedArray, task.scheduler.threads);
        task.scheduler.sharedBuffer = this.data.setupSharedArrayBuffer(params.sharedArray);
      } else {
        task.scheduler.indexes = params.indexes || this.data.getSubArrayIndexes(params.array, task.scheduler.threads);
      }
    }

    if (this.habitat.debug) {
        task.scheduler.metrics = {
          created_at: Date.now(),
          started_at: null,
          completed_at: null,
          threads: []
        };
    }

    // Assign task.input to params
    task.input = params;

    return task;
  }


  /**
   * @async
   * @function scheduleTask - Schedules a new function to be processed by the library
   * @param {object} task - Provided library execution options
   * @param {function} resolve - Parent function promise resolve method
   * @param {function} reject - Parent function promise reject method
   * @return {Promise} Promise object on completion
   */
  scheduleTask(task, resolve, reject) {
    return this.pool.scheduleTask(task)
      .then(resolve)
      .catch(reject);
  }

  /**
   * @async
   * @function hamstersPromise - Calls library functionality using async promises
   * @param {object} params - Provided library execution options
   * @param {function} functionToRun - Function to execute
   * @return {Promise} Promise resolving with results from functionToRun
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
