/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class Task {
  /**
   * @constructor
   * @param {object} habitat - The environment settings
   * @param {object} data - Data utility methods
   * @param {object} params - Provided library execution options
   * @param {function} functionToRun - Function to execute
   */
  constructor(hamsters, params, functionToRun) {
    'use strict';

    this.input = params;
    this.type = 'task-local';
    this.output = [];
    this.scheduler = {
      count: 0,
      threads: params.threads || 1,
      transfers: {
        request: 0,
        send: 0
      },
      workers: []
    };

    if (hamsters.habitat.legacy) {
      this.setupLegacyTask(hamsters, functionToRun);
    } else {
      this.setupModernTask(hamsters, params, functionToRun);
    }

    if (hamsters.habitat.debug || params.distribute) {
      this.setupDebugMetrics();
    }
  }

  /**
   * @method setupLegacyTask
   * @description Sets up task for legacy environments
   * @param {function} functionToRun - Function to execute
   */
  setupLegacyTask(hamsters, functionToRun) {
    this.scheduler.threads = 1;
    if (!hamsters.habitat.node && !hamsters.habitat.isIE) {
      this.input.hamstersJob = functionToRun;
    }
  }

  /**
   * @method setupModernTask
   * @description Sets up task for modern environments
   * @param {object} params - Provided library execution options
   * @param {function} functionToRun - Function to execute
   */
  setupModernTask(hamsters, params, functionToRun) {
    this.input.hamstersJob = hamsters.habitat.legacy ? functionToRun : hamsters.data.prepareFunction(functionToRun);
    if (params.sharedArray && hamsters.habitat.atomics) {
      this.scheduler.indexes = params.indexes || hamsters.data.getSubArrayIndexes(params.sharedArray, this.scheduler.threads);
      this.scheduler.sharedBuffer = hamsters.data.setupSharedArrayBuffer(params.sharedArray);
      this.input.sharedArray = []; //Reduce ram usage on main thread, do not preserve original array its no longer needed.
    } else {
      this.scheduler.indexes = params.indexes || hamsters.data.getSubArrayIndexes(params.array, this.scheduler.threads);
    }
  }

  /**
   * @method setupDebugMetrics
   * @description Sets up debug metrics if debug mode is enabled
   */
  setupDebugMetrics() {
    this.scheduler.metrics = {
      created_at: Date.now(),
      started_at: Date.now(),
      completed_at: null,
      threads: this.setupThreadMetrics()
    };
  }

  setupThreadMetrics() {
    let i = 0;
    let threadMetrics = [];
    while(i < this.scheduler.threads) {
      threadMetrics.push({
        created_at: Date.now(),
        started_at: null,
        enqueued_at: null,
        dequeued_at: null,
        completed_at: null
      });
      i += 1;
    }
    return threadMetrics;
  }
}
  
export default Task;
  