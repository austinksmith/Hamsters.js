/**
 * @class HamstersTask
 * @classdesc Constructs a new task object from provided arguments for Hamsters.js
 */
class Task {
    /**
     * @constructor
     * @param {object} habitat - The environment settings
     * @param {object} data - Data utility methods
     * @param {object} params - Provided library execution options
     * @param {function} functionToRun - Function to execute
     */
    constructor(hamsters, params, functionToRun) {
      this.input = params;
      this.output = [];
      this.scheduler = {
        count: 0,
        threads: params.threads || 1,
        workers: []
      };
  
      if (hamsters.habitat.legacy) {
        this.setupLegacyTask(hamsters, functionToRun);
      } else {
        this.setupModernTask(hamsters, params, functionToRun);
      }
  
      if (hamsters.habitat.debug) {
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
        started_at: null,
        completed_at: null,
        threads: []
      };
    }
  }
  
  module.exports = Task;
  