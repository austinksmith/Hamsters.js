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
import hamstersMemoizer from './core/memoizer';

class hamstersjs {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.version = hamstersVersion.current;
    this.init = this.initializeLibrary;
  }

  /**
  * @function initializeLibrary - Prepares & initializes Hamsters.js library
  * @param {object} startOptions - Provided library functionality options
  */
  initializeLibrary(startOptions) {
    this.processStartOptions(startOptions);
    if(!hamstersHabitat.legacy && hamstersHabitat.persistence === true) {
      hamstersPool.spawnHamsters(hamstersHabitat.maxThreads);
    }
    hamstersLogger.info(`Initialized using up to ${hamstersHabitat.maxThreads} threads.`);
    delete this.init;
  }

  /**
  * @function processStartOptions - Adjusts library functionality based on provided options
  * @param {object} startOptions - Provided library functionality options
  */
  processStartOptions(startOptions) {
    let legacyMode = false;
    if (typeof startOptions !== 'undefined') {
      // Add options to override library environment behavior
      let habitatKeys = [
        'worker', 'sharedworker', 'legacy',
        'webworker', 'reactnative', 'atomics',
        'proxies', 'transferrable', 'browser',
        'shell', 'node', 'debug', 'persistence',
        'importscripts', 'maxthreads', 'messageport'
      ];
      let key = null;
      for (key of Object.keys(startOptions)) {
        if (habitatKeys.indexOf(key.toLowerCase()) !== -1) {
          hamstersHabitat[key] = startOptions[key];
        } else {
          this[key] = startOptions[key];
        }
      }
      if(startOptions['legacy'] === true) {
        legacyMode = true;
      }
    }
    // Ensure legacy mode is disabled when we pass a third party worker library
    if(typeof hamstersHabitat['Worker'] === 'function' && !legacyMode) {
      hamstersHabitat.legacy = false;
    }
    // Finished initializing, add methods & imports
    this.habitat = hamstersHabitat;
    this.maxThreads = hamstersHabitat.maxThreads;
    this.data = hamstersData;
    this.logger = hamstersLogger;
    this.memoizer = hamstersMemoizer;
    this.run = this.hamstersRun;
    this.promise = this.hamstersPromise;
  }

  /**
  * @constructor
  * @function hamstersTask - Constructs a new task object from provided arguments
  * @param {object} params - Provided library execution options
  * @param {function} functionToRun - Function to execute
  * @return {object} new Hamsters.js task
  */
  hamstersTask(params, functionToRun) {
    let newHamstersTaskId = hamstersPool.tasks.length;
    let newHamstersTask = {
      id: newHamstersTaskId,
      count: 0,
      aggregate: (params.aggregate || false),
      output: [],
      workers: [],
      memoize: (params.memoize || false),
      dataType: (params.dataType ? params.dataType.toLowerCase() : null),
      input: params
    };
    // Do not modify function if we're running on the main thread for legacy fallback
    if(hamstersHabitat.legacy) {
      newHamstersTask.threads = 1;
      newHamstersTask.input.hamstersJob = functionToRun;
    } else {
      newHamstersTask.threads = (params.threads || 1);
      newHamstersTask.input.hamstersJob = hamstersData.prepareJob(functionToRun);
    }
    return newHamstersTask;
  }

  scheduleTask(task, resolve, reject) {
    hamstersPool.scheduleTask(task).then((results) => {
      return resolve(results);
    }).catch((error) => {
      return hamstersLogger.error(error.messsage, reject);
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
      let task = this.hamstersTask(params, functionToRun);
      this.scheduleTask(task, resolve, reject);
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
    let task = this.hamstersTask(params, functionToRun);
    this.scheduleTask(task, onSuccess, onError);
  }
}

export default new hamstersjs();