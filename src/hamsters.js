/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersVersion from './core/version';
import hamstersHabitat from './core/habitat';
import hamstersPool from './core/pool';
import hamstersData from './core/data';
import hamstersWheel from './core/wheel';
import hamstersLogger from './core/logger';
import hamstersMemoizer from './core/memoizer';

'use strict';

class hamstersjs {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.version = hamstersVersion;
    this.maxThreads = hamstersHabitat.logicalThreads;
    this.habitat = hamstersHabitat;
    this.data = hamstersData;
    this.pool = hamstersPool;
    this.logger = hamstersLogger;
    this.memoizer = hamstersMemoizer;
    this.run = this.hamstersRun;
    this.promise = this.hamstersPromise;
    this.init = this.initializeLibrary;
  }

  /**
  * @function initializeLibrary - Prepares & initializes Hamsters.js library
  * @param {object} startOptions - Provided library functionality options
  */
  initializeLibrary(startOptions) {
    this.logger.info(`Preparing the hamster wheels & readying hamsters`);
    if (typeof startOptions !== 'undefined') {
      this.processStartOptions(startOptions);
    }
    hamstersPool.spawnHamsters(hamstersHabitat.persistence, hamstersPool.selectHamsterWheel(), this.maxThreads);
    delete this.init;
  }

  /**
  * @function processStartOptions - Adjusts library functionality based on provided options
  * @param {object} startOptions - Provided library functionality options
  */
  processStartOptions(startOptions) {
    // Add options to override library environment behavior
    let habitatKeys = [
      'worker', 'sharedworker',
      'legacy', 'webworker',
      'reactnative', 'atomics',
      'proxies', 'transferrable',
      'browser', 'shell', 
      'node', 'debug',
      'persistence', 'importscripts'
    ];
    for (var key in startOptions) {
      if (startOptions.hasOwnProperty(key)) {
        if (habitatKeys.indexOf(key.toLowerCase()) !== -1) {
          this.habitat[key] = startOptions[key];
        } else {
          this[key] = startOptions[key];
        }
      }
    }
    // Ensure legacy mode is disabled when we pass a third party worker library
    if(typeof this.habitat.Worker === 'function') {
      this.habitat.legacy = false;
    }
  }

  /**
  * @constructor
  * @function hamstersTask - Constructs a new task object from provided arguments
  * @param {object} params - Provided library execution options
  * @param {function} functionToRun - Function to execute
  * @param {object} scope - Reference to main library context
  * @return {object} new Hamsters.js task
  */
  hamstersTask(params, functionToRun, scope) {
    this.id = scope.pool.tasks.length;
    this.count = 0;
    this.aggregate = (params.aggregate || false);
    this.output = [];
    this.workers = [];
    this.memoize = (params.memoize || false);
    this.dataType = (params.dataType ? params.dataType.toLowerCase() : null);
    this.input = params;
    // Do not modify function if we're running on the main thread for legacy fallback
    if(hamstersHabitat.legacy) {
      this.threads = 1;
      this.input.hamstersJob = functionToRun;
    } else {
      this.threads = (params.threads || 1);
      this.input.hamstersJob = scope.data.prepareJob(functionToRun);
    }
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
      let task = new this.hamstersTask(params, functionToRun, this);
      this.pool.scheduleTask(task, this.habitat.persistence, scaffold, this.maxThreads).then((results) => {
        resolve(results);
      }).catch((error) => {
        hamstersLogger.error(error.messsage, reject);
      });
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
    let task = new this.hamstersTask(params, functionToRun, this);
    let scaffold = hamstersPool.selectHamsterWheel();
    this.pool.scheduleTask(task, this.habitat.persistence, scaffold, this.maxThreads).then((results) => {
      onSuccess(results);
    }).catch((error) => {
      hamstersLogger.error(error.messsage, onError);
    });
  }
}

var hamsters = new hamstersjs();

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsters;
}