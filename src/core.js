/*
* Title: this.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

'use strict';

class hamsters {
   constructor() {
    this.version = '4.2.2';
    this.maxThreads = this.determineGlobalMaxThreads();
    this.debug = false;
    this.persistence = true;
    this.transferrable = true;
    this.memoize = false;
    this.atomics = false;
    this.legacy = false;
    this.run = this.runHamster;
    this.habitat = {

    };
    this.tools = {
      randomArray: this.randomArray
    };
    this.uri = null;
    this.tasks = [];
    this.errors = [];
    this.threads = [];
    this.running = [];
    this.pending = [];
    this.init = this.initializeLibrary;
  }


  initializeLibrary(startOptions) {
    // Determine execution environment
    this.habitat.browser = typeof window === "object";
    this.habitat.worker  = typeof importScripts === "function";
    this.habitat.node = typeof process === "object" && typeof require === "function" && !this.habitat.browser && !this.habitat.worker && !this.habitat.reactNative;
    this.habitat.reactNative = !this.habitat.node && typeof global === 'object';
    this.habitat.shell = !this.habitat.browser && !this.habitat.node && !this.habitat.worker && !this.habitat.reactNative;
    if(typeof startOptions !== 'undefined') {
      this.processStartOptions(startOptions);
    }
    if(this.habitat.browser && !this.habitat.reactNative) {
      this.setupBrowserSupport();
    }
    if(this.habitat.worker) {
      this.setupWorkerSupport();
    }
    if(this.habitat.node || this.habitat.reactNative) {
      if(typeof this.Worker !== 'undefined') {
        global.Worker = this.Worker;
      }
    }
    if(this.habitat.shell || typeof Worker === 'undefined') {
      this.habitat.legacy = true;
    }
    if(typeof Uint8Array === 'undefined') {
      this.habitat.transferrable = false;
    }
    if(typeof SharedArrayBuffer !== 'undefined') {
      this.habitat.atomics = true;
    }
    if(this.habitat.legacy) {
      this.habitat.wheel = this.legacyHamsterWheel;
    } else {
      this.habitat.wheel = this.hamsterWheel;
      this.spawnHamsters();
    }
    this.chewGarbage(startOptions);
  }

  isIE(version) {
    return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
  }

  determineGlobalMaxThreads() {
    // Default to global thread count of 4
    let max = 4;
    // Detect logical core count on machine
    if(typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency !== 'undefined') {
      max = navigator.hardwareConcurrency;
    }
    // Firefox per origin limit is 20
    if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1 && max > 20) {
      max = 20;
    }
    // Got it
    return max;
  }


  setupBrowserSupport() {
    if(typeof Worker === 'undefined' || ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'].indexOf(navigator.userAgent) !== -1) {
      this.habitat.legacy = true;
    }

    if(this.isIE(10)) {
      try {
        let testThread = new Worker('src/common/wheel.min.js');
        testThread.terminate();
        this.habitat.ie10 = true;
      } catch(e) {
        this.habitat.legacy = true;
      }
    }
  }

  setupWorkerSupport() {
    try {
      let workerBlob = this.generateWorkerBlob();
      let SharedHamster = new SharedWorker(workerBlob, 'SharedHamsterWheel');
      this.uri = workerBlob;
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
    return URL.createObjectURL(this.createBlob('(' + String(this.giveHamsterWork()) + ')();'));
  }

  spawnHamsters() {
    if(this.habitat.browser) {
      this.uri = this.generateWorkerBlob();
    }
    if(this.persistence) {
      let i = this.maxThreads;
      for (i; i > 0; i--) {
        this.threads.push(this.spawnHamster());
      }
    }
  }

  spawnHamster() {
    if(this.habitat.ie10) {
      return new Worker('src/common/wheel.min.js');
    } else if(this.habitat.worker) {
      return new SharedWorker(this.uri, 'SharedHamsterWheel');
    } else if (this.habitat.node) {
      return new Worker(this.giveHamsterWork());
    } else {
      return new Worker(this.uri);
    }
  }

  giveHamsterWork() {
    if(this.habitat.worker) {
      return this.workerWorker;
    }
    return this.worker;
  }

  createBlob(textContent) {
    if(!Blob) {
      let BlobMaker = (BlobBuilder || WebKitBlobBuilder || MozBlobBuilder || MSBlobBuilder);
      let blob = new BlobMaker();
      blob.append([textContent], {
        type: 'application/javascript'
      });
      return blob.getBlob();
    } 
    return new Blob([textContent], {
      type: 'application/javascript'
    });
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
    var processDataType = function(dataType, buffer) {
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
    }

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
        rtn.data = processDataType(params.dataType, rtn.data);
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

  legacyHamsterWheel(inputArray, hamsterFood, aggregate, onSuccess, task, thread_id, hamster, memoize) {
    trackThread(task, this.running, thread_id);
    if(memoize || this.debug) {
      trackInput(inputArray, thread_id, task, hamsterFood);
    }
    legacyProcessor(hamsterFood, inputArray, function(output) {
      clean(task, thread_id);
      task.output[thread_id] = output.data;
      if(task.workers.length === 0 && task.count === task.threads) {
        onSuccess(getOutput(task.output, aggregate, output.dataType));
        this.pool.tasks[task.id] = null;
        if(this.cache && memoize !== false) {
          memoize(task.fn, task.input, output.data, output.dataType);
        }
      }
    });
    task.count += 1; //Thread finished
  }

  hamsterWheel(inputArray, hamsterFood, aggregate, onSuccess, task, thread_id, hamster, memoize) {
    if(this.maxThreads === this.running.length) {
      poolThread(inputArray, hamsterFood, thread_id, onSuccess, task, aggregate, memoize);
      return;
    }
    if(memoize || this.debug) {
      trackInput(inputArray, thread_id, task, hamsterFood);
    }
    if(!hamster) {
      if(this.persistence) {
        hamster = this.pool.threads[this.running.length];
      } else {
        hamster = spawnHamster();
      }
    }
    trainHamster(thread_id, aggregate, onSuccess, task, hamster, memoize);
    trackThread(task, this.running, thread_id);
    hamsterFood.array = inputArray;
    feedHamster(hamster, hamsterFood);
    task.count += 1; //Increment count, thread is running
    if(this.debug === 'verbose') {
      console.info('Spawning Hamster #' + thread_id + ' @ ' + new Date().getTime());
    }
  }

  chewGarbage(startOptions) {
    delete this.init;
    startOptions = null;
  }


  splitArray(array, n) {
    let i = 0;
    let threadArrays = [];
    let size = Math.ceil(array.length/n);
    if(array.slice) {
      while(i < array.length) {
        threadArrays.push(array.slice(i, i += size));
      }
    } else {
      while (i < array.length) {
        threadArrays.push(array.subarray(i, i += size));
      }
    }
    return threadArrays;
  }

  loop(input, onSuccess) {
    let params = {
      run: prepareFunction(input.operator),
      init: input.startIndex || 0,
      limit: input.limit,
      array: input.array,
      incrementBy: input.incrementBy || 1,
      dataType: input.dataType || null,
      worker: this.habitat.worker
    };
    this.run(params, function() {
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

  parseJsonOnThread(string, onSuccess) {
    this.run({input: string}, function() {
      rtn.data = JSON.parse(params.input);
    }, function(output) {
      onSuccess(output[0]);
    }, 1);
  }

  stringifyJsonOnThread(json, onSuccess) {
    this.run({input: json}, function() {
      rtn.data = JSON.stringify(params.input);
    }, function(output) {
      onSuccess(output[0]);
    }, 1);
  }

  runHamster(params, fn, onSuccess, workers, aggregate, dataType, memoize, order) {
    if(!params || !fn) {
      return 'Error processing for loop, missing params or function';
    }
    workers = (this.habitat.legacy ? 1 : (workers || 1));
    let task = this.newTask(this.pool.tasks.length, workers, order, dataType, fn, onSuccess);
    if(dataType) {
      dataType = dataType.toLowerCase();
    }
    if(this.cache && memoize) {
      let result = checkCache(fn, task.input, dataType);
      if(result && onSuccess) {
        setTimeout(function() {
          this.pool.tasks[taskid] = null; //Clean up our task, not needed any longer
          onSuccess(result);
        }, 4);
        return;
      }
    }
    this.work(task, params, fn, onSuccess, aggregate, dataType, memoize, order);
  }

  randomArray(count, onSuccess) {
    let params = {
      count: count
    };
    hamsters.run(params, function() {
      while(params.count > 0) {
        rtn.data[rtn.data.length] = Math.round(Math.random() * (100 - 1) + 1);
        params.count -= 1;
      }
    }, function(result) {
      onSuccess(result);
    });
  }

  aggregateThreadOutputs(input, dataType) {
    if(!dataType || !this.habitat.transferrable) {
      return input.reduce(function(a, b) {
        return a.concat(b);
      });
    }
    let i = 0;
    let len = input.length;
    let bufferLength = 0;
    for (i; i < len; i += 1) {
      bufferLength += input[i].length;
    }
    let output = this.processDataType(dataType, bufferLength);
    let offset = 0;
    for (i = 0; i < len; i += 1) {
      output.set(input[i], offset);
      offset += input[i].length;
    }
    return output;
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

  sort(arr, order) {
    switch(order) {
      case 'desc':
      case 'asc':
        return Array.prototype.sort.call(arr, function(a, b) {
          return (order === 'asc' ? (a - b) : (b - a)); 
        });
      case 'ascAlpha':
        return arr.sort();
      case 'descAlpha':
        return arr.reverse();
      default:
        return arr;
    }
  }

  work(task, params, fn, onSuccess, aggregate, dataType, memoize, order) {
    let workArray = params.array;
    if(workArray && task.threads !== 1) {
      workArray = this.splitArray(workArray, task.threads); //Divide our array into equal array sizes
    }
    let food = {};
    let key;
    for(key in params) {
      if(params.hasOwnProperty(key) && key !== 'array') {
        food[key] = params[key];
      }
    }
    food.fn = this.prepareFunction(fn);
    food.dataType = dataType;
    let i = 0;
    while(i < task.threads) {
      if(workArray && task.threads !== 1) {
        this.habitat.wheel(workArray[i], food, aggregate, onSuccess, task, task.count, null, memoize);
      } else {
        this.habitat.wheel(workArray, food, aggregate, onSuccess, task, task.count, null, memoize);
      }
      i += 1;
    }
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
      start: new Date().getTime()
    });
  }

  trackThread(task, running, id) {
    task.workers.push(id); //Keep track of threads scoped to current task
    running.push(id); //Keep track of all currently running threads
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

  legacyProcessor(params, inputArray, onSuccess) {
    setTimeout(function() {
      var rtn = {
        success: true, 
        data: []
      };
      var params = params;
      params.array = inputArray;
      params.fn();
      if(params.dataType && params.dataType != "na") {
        rtn.data = processDataType(params.dataType, rtn.data);
        rtn.dataType = params.dataType;
      }
      onSuccess(rtn);
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  }

  getOutput(output, aggregate, dataType) {
    if(aggregate && output.length <= 20) {
      return aggregateThreadOutputs(output, dataType);
    }
    return output;
  }

  processQueue(hamster, item) {
    if(!item) {
      return;
    }
    this.habitat.wheel(item.input, item.params, item.aggregate, item.onSuccess, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
  }

  clean(task, id) {
    this.running.splice(this.running.indexOf(id), 1); //Remove thread from running pool
    task.workers.splice(task.workers.indexOf(id), 1); //Remove thread from task running pool
  }

  trainHamster(id, aggregate, onSuccess, task, hamster, memoize) {
    var onmessage = function(e, results) {
      clean(task, id);
      results = e.data.results;
      task.output[id] = results.data;
      if(this.debug === 'verbose') {
        console.info('Hamster #' + id + ' finished ' + '@ ' + e.timeStamp);
      }
      if(task.workers.length === 0 && task.count === task.threads) {
        if(task.order) {
          onSuccess(sort(getOutput(task.output, aggregate, results.dataType), task.order));
        } else {
          onSuccess(getOutput(task.output, aggregate, results.dataType));
        }
        if(this.debug) {
          console.info('Execution Complete! Elapsed: ' + ((e.timeStamp - task.input[0].start)/1000) + 's');
        }
        this.pool.tasks[task.id] = null; //Clean up our task, not needed any longer
        if(this.cache && memoize) {
          if(task.output[id] && !task.output[id].slice) {
            memoize(task.fn, task.input[0].input, normalizeArray(output), results.dataType);
          } else {
            memoize(task.fn, task.input[0].input, getOutput(task.output, aggregate, results.dataType), results.dataType);
          }
        }
      }
      if(this.pool.pending.length !== 0) {
        processQueue(hamster, this.pool.pending.shift());
      } else if(!this.persistence && !this.habitat.worker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    };

    var onerror = function(e) {
      if(!this.habitat.worker) {
        hamster.terminate(); //Kill the thread
      }
      this.pool.errors.push({
        msg: 'Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message
      });
      console.error('Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message);
    };

    if(this.habitat.worker) {
      hamster.port.onmessage = onmessage;
      hamster.port.onerror = onerror;
    } else {
      hamster.onmessage = onmessage;
      hamster.onerror = onerror;
    }   
  }

  processData(dataType, buffer) {
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
      return dataType;
    }
    return new types[dataType](buffer);
  }

  processDataType(dataType, buffer) {
    if(this.habitat.transferrable) {
      return processData(dataType, buffer);
    }
    return buffer;
  }

  feedHamster(hamster, food) {
    if(this.habitat.worker) {
      return hamster.port.postMessage(food);
    }
    if(this.habitat.ie10) {
      return hamster.postMessage(food);
    }
    let buffers = [], key;
    for(key in food) {
      if(food.hasOwnProperty(key) && food[key] && food[key].buffer) {
        buffers.push(food[key].buffer);
      }
    }
    return hamster.postMessage(food,  buffers);
  } 

}

module.exports = new hamsters();