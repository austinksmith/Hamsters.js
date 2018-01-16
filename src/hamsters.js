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
    this.loop = this.hamstersLoop;
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
    this.spawnHamsters();
    this.chewGarbage(startOptions);
    this.logger.info(`${this.maxThreads} hamsters ready and awaiting instructions`);
  }

  greaseHamsterWheel() {
    if (this.habitat.legacy) {
      this.wheel = this.legacyHamsterWheel;
    } else {
      this.wheel = this.hamsterWheel;
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
      let workerBlob = this.generateWorkerBlob();
      let SharedHamster = new this.habitat.SharedWorker(workerBlob, 'SharedHamsterWheel');
      this.pool.uri = workerBlob;
    } catch (e) {
      this.habitat.legacy = true;
    }
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

  generateWorkerBlob(workerLogic) {
    let functionString = '(' + String(workerLogic) + ')();';
    let hamsterBlob = this.data.createBlob(functionString);
    return URL.createObjectURL(hamsterBlob);
  }

  spawnHamsters() {
    if (this.habitat.legacy) {
      return;
    }
    if (this.habitat.browser) {
      this.pool.uri = this.generateWorkerBlob(this.giveHamsterWork());
    }
    if (this.persistence) {
      let i = this.maxThreads;
      this.logger.info(`${i} Logical Threads Detected, Spawning ${i} Hamsters`);
      for (i; i > 0; i--) {
        this.pool.threads.push(this.spawnHamster());
      }
    }
  }

  spawnHamster() {
    if (this.habitat.ie10) {
      return new this.habitat.Worker('src/common/wheel.min.js');
    }
    if (this.habitat.webWorker) {
      return new this.habitat.SharedWorker(this.pool.uri, 'SharedHamsterWheel');
    }
    if (this.habitat.node) {
      return new this.habitat.Worker(this.giveHamsterWork());
    }
    return new this.habitat.Worker(this.pool.uri);
  }

  giveHamsterWork() {
    if (this.habitat.webWorker) {
      return this.workerWorker;
    }
    return this.worker;
  }


  workerWorker() {
    self.addEventListener("connect", function(e) {
      const port = e.ports[0];
      port.start();
      port.addEventListener("message", function(e) {
        self.params = e.data;
        self.rtn = {
          data: [],
          dataType: params.dataType
        };
        let fn = eval("(" + params.fn + ")");
        if (fn) {
          fn();
        }
        port.postMessage({
          results: rtn
        });
      }, false);
    }, false);
  }

  worker() {
    self.typedArrayFromBuffer = function(dataType, buffer) {
      const types = {
        'uint32': Uint32Array,
        'uint16': Uint16Array,
        'uint8': Uint8Array,
        'uint8clamped': Uint8ClampedArray,
        'int32': Int32Array,
        'int16': Int16Array,
        'int8': Int8Array,
        'float32': Float32Array,
        'float64': Float64Array
      };
      if (!types[dataType]) {
        return buffer;
      }
      return new types[dataType](buffer);
    };

    self.prepareTransferBuffers = function(hamsterFood) {
      let buffers = [];
      let key = null;
      for (key in hamsterFood) {
        if (hamsterFood.hasOwnProperty(key) && hamsterFood[key]) {
          if(hamsterFood[key].buffer) {
            buffers.push(hamsterFood[key].buffer);
          } else if(Array.isArray(hamsterFood[key]) && typeof ArrayBuffer !== 'undefined') {
            buffers.push(new ArrayBuffer(hamsterFood[key]));
          }
        }
      }
      return buffers;
    }

    self.onmessage = function(e) {
      self.params = e.data;
      self.rtn = {
        data: [],
        dataType: params.dataType ? params.dataType.toLowerCase() : null
      };
      let fn = new Function(params.fn);
      if (fn) {
        fn();
      }
      if (params.dataType) {
        rtn.data = self.typedArrayFromBuffer(rtn.dataType, rtn.data);
      }
      postMessage(rtn, self.prepareTransferBuffers(rtn));
    };
  }

  newTask(taskOptions) {
    this.pool.tasks.push(taskOptions);
    return this.pool.tasks[taskOptions.id];
  }

  legacyHamsterWheel(thread_id, task, resolve, reject) {
    // this.trackThread(task, thread_id);
    var dataArray = this.data.arrayFromIndex(task.input.array, task.indexes[thread_id]);
    this.legacyProcessor(task, dataArray, resolve, reject);
    task.count += 1; //Thread finished
  }

  chewGarbage(startOptions) {
    delete this.init;
    startOptions = null;
  }

  hamstersLoop(input, onSuccess) {
    let params = {
      run: this.prepareFunction(input.operator),
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

  prepareFunction(functionBody) {
    if (!this.habitat.legacy) {
      functionBody = String(functionBody);
      if (!this.habitat.webWorker) {
        let startingIndex = (functionBody.indexOf("{") + 1);
        let endingIndex = (functionBody.length - 1);
        return functionBody.substring(startingIndex, endingIndex);
      }
    }
    return functionBody;
  }

  hamstersTask(params, functionToRun, scope) {
    this.id = scope.pool.tasks.length;
    this.threads = params.threads || 1;
    this.count = 0;
    this.input = params;
    this.aggregate = params.aggregate || true;
    this.output = [];
    this.workers = [];
    this.operator = scope.prepareFunction(functionToRun);
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
      this.hamstersWork(task).then(function(results) {
        resolve(results);
      }).catch(function(error) {
        logger.error(error.messsage);
        reject(error);
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
    this.hamstersWork(task).then(function(results) {
      onSuccess(results);
    }).catch(function(error) {
      logger.error(error.messsage);
    });
  }

  hamstersWork(task) {
    return new Promise((resolve, reject) => {
      let i = 0;
      while (i < task.threads) {
        this.wheel(task, resolve, reject);
        i += 1;
      }
    });
  }

  hamsterWheel(task, resolve, reject) {
    let threadId = this.pool.running.length;
    if(this.maxThreads === threadId) {
      return this.poolThread(task, threadId, resolve, reject);
    }
    let hamster = this.persistence ? this.pool.threads[threadId] : spawnHamster();
    let hamsterFood = this.prepareHamsterFood(task, threadId);
    this.trainHamster(threadId, task, hamster, resolve, reject);
    this.trackThread(task, threadId);
    this.feedHamster(hamster, hamsterFood);
    task.count += 1; //Increment count, thread is running
  }

  prepareHamsterFood(task, threadId) {
    let hamsterFood = {};
    for (var key in task.input) {
      if (task.input.hasOwnProperty(key) && key !== 'array') {
        hamsterFood[key] = task.input[key];
      }
    }
    if (task.indexes && task.threads !== 1) {
      hamsterFood.array = this.data.arrayFromIndex(task.input.array, task.indexes[threadId]);
    } else {
      hamsterFood.array = task.input.array;
    }
    if (task.operator && !hamsterFood.fn) {
      hamsterFood.fn = task.operator;
    }
    return hamsterFood;
  }

  feedHamster(hamster, hamsterFood) {
    if (this.habitat.webWorker) {
      return hamster.port.postMessage(hamsterFood);
    }
    if (this.habitat.ie10) {
      return hamster.postMessage(hamsterFood);
    }
    return hamster.postMessage(hamsterFood, this.prepareTransferBuffers(hamsterFood));
  }

  prepareTransferBuffers(hamsterFood) {
    let buffers = [];
    let key = null;
    if(this.habitat.transferrable) {
      for (key in hamsterFood) {
        if (hamsterFood.hasOwnProperty(key) && hamsterFood[key]) {
          if(hamsterFood[key].buffer) {
            buffers.push(hamsterFood[key].buffer);
          } else if(Array.isArray(hamsterFood[key]) && typeof ArrayBuffer !== 'undefined') {
            buffers.push(new ArrayBuffer(hamsterFood[key]));
          }
        }
      }
    }
    return buffers;
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
        scope.processQueue(hamster, scope.pool.pending.shift());
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

  checkCache(fn, input, dataType) {
    let cachedResult = this.cache[fn];
    if (cachedResult) {
      if (cachedResult[0] === input && cachedResult[2] === dataType) {
        return cachedResult;
      }
    }
  }

  memoize(fn, inputArray, output, dataType) {
    this.cache[fn] = [inputArray, output, dataType];
  }


  assignOutput(task, inputArray) {
    if (!task || !inputArray || !this.habitat.atomics) {
      return;
    }
    task.output = new SharedArrayBuffer(inputArray.length);
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

  poolThread(inputArray, hamsterFood, thread_id, cb, task, agg, memoize) {
    this.pool.pending.push({
      memoize: memoize,
      input: inputArray,
      params: hamsterFood,
      workerid: thread_id,
      onSuccess: cb,
      task: task,
      aggregate: agg
    });
  }

  legacyProcessor(task, array, resolve, reject) {
    setTimeout(function() {
      var rtn = {
        success: true,
        data: []
      };
      var params = task.input;
      params.array = array;
      params.fn();
      if (params.dataType) {
        rtn.data = this.data.processDataType(params.dataType, rtn.data, this.habitat.transferable);
        rtn.dataType = params.dataType;
      }
      resolve(rtn);
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  }

  processQueue(hamster, item) {
    if (!item) {
      return;
    }
    this.wheel(item.input, item.params, item.aggregate, item.onSuccess, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
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