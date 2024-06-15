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
import Task from './core/task';

//Features
import Memoize from './feature/memoize';

class hamstersjs {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    'use strict';

    this.version = '5.5.8';
    this.run = this.hamstersRun.bind(this);
    this.promise = this.hamstersPromise.bind(this);
    this.init = this.inititializeLibrary.bind(this);
    this.data = {};
    this.pool = {};
    this.wheel = {};
    this.habitat = {};
    this.memoize = {};
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
    this.memoize = new Memoize(this, 100); //Set a maximum of 100 memoized function results, LRU cache

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
   * @async
   * @function scheduleTask - Schedules a new function to be processed by the library
   * @param {object} task - Provided library execution options
   * @param {function} resolve - Parent function promise resolve method
   * @param {function} reject - Parent function promise reject method
   * @return {Promise} Promise object on completion
   */
  scheduleTask(task, resolve, reject) {
    if (task.input.memoize) {
      // Pass the task object to the memoized function
      const memoizedFunction = this.memoize.memoize(() => this.pool.scheduleTask(task));
      return memoizedFunction(task).then(resolve).catch(reject);
    } else {
      return this.pool.scheduleTask(task)
        .then(resolve)
        .catch(reject);
    }
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
      this.scheduleTask(new Task(this, params, functionToRun), resolve, reject);
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
    this.scheduleTask(new Task(this, params, functionToRun), onSuccess, onError);
  }
}

const hamsters = new hamstersjs();

module.exports = hamsters;
