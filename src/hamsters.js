/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

/* jshint esversion: 6 */

'use strict';

import hamsterHabitat from './core/habitat';
import hamsterPool from './core/pool';
import hamsterData from './core/data';
import hamsterTools from './core/tools';

class hamstersjs {
   constructor() {
    this.version = '4.2.2';
    this.maxThreads = hamsterHabitat.logicalThreads;
    this.debug = false;
    this.persistence = true;
    this.memoize = false;
    this.atomics = false;
    this.legacy = false;
    this.tools = hamsterTools;
    this.habitat = hamsterHabitat;
    this.data = hamsterData;
    this.pool = hamsterPool;
    this.run = this.runHamsters;
    this.promise = this.hamstersPromise;  
    this.loop = this.hamstersLoop;
    this.init = this.initializeLibrary;
  }

  initializeLibrary(startOptions) {
    if(typeof startOptions !== 'undefined') {
      this.processStartOptions(startOptions);
    }
    if(this.habitat.browser && !this.habitat.reactNative) {
      this.setupBrowserSupport();
    }
    if(this.habitat.worker && typeof SharedWorker !== 'undefined') {
      this.setupWorkerSupport();
    }
    if(this.habitat.node || this.habitat.reactNative) {
      if(typeof this.Worker !== 'undefined') {
        global.Worker = this.Worker;
      }
    }
    if(this.habitat.legacy) {
      this.wheel = this.legacyHamsterWheel;
    } else {
      this.wheel = this.hamsterWheel;
      this.spawnHamsters();
    }
    this.chewGarbage(startOptions);
  }

  setupBrowserSupport() {
    if(typeof Worker === 'undefined' || ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'].indexOf(navigator.userAgent) !== -1 || this.habitat.isIE(10)) {
      this.habitat.legacy = true;
    }
  }

  setupWorkerSupport() {
    try {
      let workerBlob = this.generateWorkerBlob();
      let SharedHamster = new SharedWorker(workerBlob, 'SharedHamsterWheel');
      this.pool.uri = workerBlob;
    } catch(e) {
      this.habitat.legacy = true;
    }
  }

  processStartOptions(startOptions) {
    for(var key in startOptions) {
      if(startOptions.hasOwnProperty(key)) {
        hamsters[key] = startOptions[key];
      }
    }
  }

  generateWorkerBlob() {
    return URL.createObjectURL(this.data.createBlob('(' + String(this.giveHamsterWork()) + ')();'));
  }

  spawnHamsters() {
    if(this.habitat.browser) {
      this.pool.uri = this.generateWorkerBlob();
    }
    if(this.persistence) {
      let i = this.maxThreads;
      for (i; i > 0; i--) {
        this.pool.threads.push(this.spawnHamster());
      }
    }
  }

  spawnHamster() {
    if(this.habitat.ie10) {
      return new Worker('src/common/wheel.min.js');
    } else if(this.habitat.worker) {
      return new SharedWorker(this.pool.uri, 'SharedHamsterWheel');
    } else if (this.habitat.node) {
      return new Worker(this.giveHamsterWork());
    } else {
      return new Worker(this.pool.uri);
    }
  }

  giveHamsterWork() {
    if(this.habitat.worker) {
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
      if(!types[dataType]) {
        return buffer;
      }
      return new types[dataType](buffer);
    };

    self.onmessage = function(e) {
      self.params = e.data;
      self.rtn = {
        data: [],
        dataType: params.dataType
      };
      let fn = new Function(params.fn);
      if(fn) {
        fn();
      }
      if(params.dataType) {
        rtn.data = self.typedArrayFromBuffer(params.dataType, rtn.data);
        postMessage({
          results: rtn
        }, [rtn.data.buffer]);
      } else {
        postMessage({
          results: rtn
        });
      }
    };
  }

  newTask(taskOptions) {
    this.pool.tasks.push(taskOptions);
    return this.pool.tasks[taskOptions.id];
  }

  legacyHamsterWheel(thread_id, task, resolve, reject) {
    // this.trackThread(task, thread_id);
    var dataArray = this.data.arrayFromIndex(task.params.array, task.indexes[thread_id]);
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
      limit: input.limit,
      array: input.array,
      incrementBy: input.incrementBy || 1,
      dataType: input.dataType || null,
      worker: this.habitat.worker
    };
    this.runHamsters(params, function() {
      let operator = params.run;
      if(typeof operator === "string") {
        if(params.worker) {
          operator = eval("(" + operator + ")");
        } else {
          operator = new Function(operator);
        }
      }
      if(!params.limit) {
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
    if(!this.habitat.legacy) {
      functionBody = String(functionBody);
      if(!this.habitat.worker) {
        let startingIndex = (functionBody.indexOf("{") + 1);
        let endingIndex = (functionBody.length - 1);
        return functionBody.substring(startingIndex, endingIndex);
      }
    }
    return functionBody;
  }

  hamstersPromise(params, functionToRun) {
    return new Promise((resolve, reject) => {
       let task = this.newTask(params);
       let results = this.work(task, functionToRun);
       if(results) {
        resolve(results);
       } else {
        reject('Error processing');
       }
    });
  }

  // Converts old run params into new format
  prepareAndSaveTaskOptions(params, functionToRun, onSuccess, numberOfWorkers, aggregateThreadOutputs, dataType, memoize, sortOrder) {
    var arrayType = 'na';
    if(params.dataType) {
      arrayType = params.dataType.toLowerCase();
    } 
    if(dataType) {
      arrayType = dataType.toLowerCase();
    }
    var task = {
      params: params,
      id: this.pool.tasks.length,
      count: 0,
      performance: [],
      workers: [],
      input: [],
      output: [],
      threads: params.threads || numberOfWorkers || 1,
      operator: this.prepareFunction(functionToRun),
      sortOrder: params.sortOrder || sortOrder,
      cacheResults: params.memoize || memoize || false,
      aggregateThreadOutputs: aggregateThreadOutputs || false,
      dataType: arrayType,
      onSuccess: onSuccess
    };
    if(params.array) {
      task.indexes = this.data.determineSubArrays(params.array, task.threads);
    }
    return this.newTask(task);
  }

  runHamsters(params, functionToRun, onSuccess, numberOfWorkers, aggregateThreadOutputs, dataType, memoize, sortOrder) {
    // Legacy processing use only 1 simulated thread, avoid doing extra work splitting & aggregating
    let workerCount = (this.habitat.legacy ? 1 : (numberOfWorkers || 1));
    let task = this.prepareAndSaveTaskOptions(params, functionToRun, onSuccess, workerCount, aggregateThreadOutputs, dataType, memoize  , sortOrder);
    this.hamstersWork(task).then(function(results) {
      onSuccess(results);
    }).catch(function(error) {
      let errorMessage = `Hamsters.js Error @ ${error.timeStamp} : ${error.message}`;
      console.error(errorMessage, error);
    });
  }

  hamstersWork(task) {
    return new Promise((resolve, reject) => {
      let i = 0;
      while(i < task.threads) {
        this.wheel(i, task, resolve, reject);
        i += 1;
      }
    });
  }

  hamsterWheel(threadId, task, resolve, reject) {
    // let threadId = this.pool.running.length;
    var hamster = {};
    if(this.maxThreads === threadId) {
      this.poolThread(task, threadId, resolve, reject);
    } else {
      if(this.persistence) {
        hamster = this.pool.threads[threadId];
      } else {
        hamster = spawnHamster();
      }
      let hamsterFood = this.prepareHamsterFood(task, threadId);
      this.trainHamster(threadId, task, hamster, resolve, reject);
      this.trackThread(task, threadId);
      this.feedHamster(hamster, hamsterFood);
      task.count += 1; //Increment count, thread is running
      // if(this.debug === 'verbose') {
      //   console.info('Spawning Hamster #' + thread_id + ' @ ' + new Date().getTime());
      // }
    }
  }

  prepareHamsterFood(task, threadId) {
    let hamsterFood = {};
    for(var key in task.params) {
      if(task.params.hasOwnProperty(key) && key !== 'array') {
        hamsterFood[key] = task.params[key];
      }
    }
    if(task.indexes && task.threads !== 0) {
      hamsterFood.array = this.data.arrayFromIndex(task.params.array, task.indexes[threadId]);
    }
    if(task.operator && !hamsterFood.fn) {
      hamsterFood.fn = task.operator;
    }
    return hamsterFood;
  }

  feedHamster(hamster, hamsterFood) {
    if(this.habitat.worker) {
      return hamster.port.postMessage(hamsterFood);
    }
    if(this.habitat.ie10) {
      return hamster.postMessage(hamsterFood);
    }
    let buffers = [], key;
    for(key in hamsterFood) {
      if(hamsterFood.hasOwnProperty(key) && hamsterFood[key] && hamsterFood[key].buffer) {
        buffers.push(hamsterFood[key].buffer);
      }
    }
    return hamster.postMessage(hamsterFood,  buffers);
  } 

  trainHamster(threadId, task, hamster, resolve, reject) {
    var scope = this;
    // Handle successful response from a thread
    var onThreadResponse = function(e, results) {
      let threadResponse = e.data.results;
      scope.chewThread(task, threadId);
      results = e.data.results;
      task.output[threadId] = results.data;
      if(task.workers.length === 0 && task.count === task.threads) {
        var output = scope.data.getOutput(task.output, task.aggregateThreadOutputs, task.dataType);
        if(task.order) {
          resolve(scope.data.sortOutput(output, task.order));
        } else {
          resolve(output);
        }
        scope.pool.tasks[task.id] = null; //Clean up our task, not needed any longer
      }
      if(scope.pool.pending.length !== 0) {
        scope.processQueue(hamster, scope.pool.pending.shift());
      } else if(!scope.persistence && !scope.habitat.worker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    };

    // Handle error response from a thread
    var onThreadError = function(e) {
      if(!scope.habitat.worker) {
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

    if(this.habitat.worker) {
      hamster.port.onmessage = onThreadResponse;
      hamster.port.onerror = onThreadError;
    } else {
      hamster.onmessage = onThreadResponse;
      hamster.onerror = onThreadError;
    }   
  }

  checkCache(fn, input, dataType) {
    let cachedResult = this.cache[fn];
    if(cachedResult) {
      if(cachedResult[0] === input && cachedResult[2] === dataType) {
        return cachedResult;
      }
    }
  }

  memoize(fn, inputArray, output, dataType) {
    this.cache[fn] = [inputArray, output, dataType];
  }


  assignOutput(task, inputArray) {
    if(!task || !inputArray || !this.habitat.atomics) {
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
      var params = task.params;
      params.array = array;
      params.fn();
      if(params.dataType && params.dataType != "na") {
        rtn.data = this.data.processDataType(params.dataType, rtn.data);
        rtn.dataType = params.dataType;
      }
      resolve(rtn);
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  }

  processQueue(hamster, item) {
    if(!item) {
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

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsters;
}
