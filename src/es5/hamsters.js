/*
* Title: WebHamsters
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

var hamsters = {
    version: '4.0.0',
    debug: false,
    cache: false,
    persistence: true,
    maxThreads: 4,
    tools: {},
    wheel: {
      env: {
        legacy: false,
        node: false,
        shell: false,
        worker: false,
        browser: false,
        ie10: false,
        transferrable: true
      },
      queue: {
        running: [],
        pending: []
      },
      cache: {},
      hamsters: [], 
      tasks: [],
      errors: [],
      uri: null
    }
  };

/**
 * @description: Initializes and sets up library functionality
 * @return
 */
(function() {
  "use strict";

  function isIE(version) {
    return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
  }

  function setupBrowserSupport() {
    if(!Worker || ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'].indexOf(navigator.userAgent) !== -1) {
      hamsters.wheel.env.legacy = true;
    } else if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
      hamsters.maxThreads = (hamsters.maxThreads > 20 ? 20 : hamsters.maxThreads);
    } else if(isIE(10)) {
      try {
        var hamster = new Worker('src/common/wheel.min.js');
        hamster.terminate();
        hamsters.wheel.env.ie10 = true;
      } catch(e) {
        hamsters.wheel.env.legacy = true;
      }
    }
  }

  function setupWorkerSupport() {
    try {
      hamsters.wheel.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + '());'));
      var SharedHamster = new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel');
    } catch(e) {
      hamsters.wheel.env.legacy = true;
    }
  }

  function setupHamstersEnvironment(callback) {
    hamsters.wheel.env.browser = typeof window === "object";
    hamsters.wheel.env.worker  = typeof importScripts === "function";
    hamsters.wheel.env.node = typeof process === "object" && typeof require === "function" && !hamsters.wheel.env.browser && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
    hamsters.wheel.env.reactNative = !hamsters.wheel.env.node && typeof global === 'object';
    hamsters.wheel.env.shell = !hamsters.wheel.env.browser && !hamsters.wheel.env.node && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
    if(typeof navigator === 'object') {
      hamsters.maxThreads = navigator.hardwareConcurrency;
    }
    if(hamsters.wheel.env.browser) {
      setupBrowserSupport();
    }
    if(hamsters.wheel.env.worker) {
      setupWorkerSupport();
    }
    if(hamsters.wheel.env.reactNative || hamsters.wheel.env.node) {
      global.self = global;
    }
    if(hamsters.wheel.env.shell || typeof Worker === 'undefined') {
      hamsters.wheel.env.legacy = true;
    }
    if(typeof Uint8Array === 'undefined') {
      hamsters.wheel.env.transferrable = false;
    }
    callback(hamsters.wheel.env.legacy);
  }

  function spawnHamsters() {
    if(hamsters.wheel.env.browser) {
      hamsters.wheel.uri = self.URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + '());'));
    }
    if(hamsters.persistence) {
      var i = hamsters.maxThreads;
      for (i; i > 0; i--) {
        if(hamsters.wheel.env.ie10) {
          hamsters.wheel.hamsters.push(new Worker('src/common/wheel.min.js'));
        } else if(hamsters.wheel.env.worker) {
          hamsters.wheel.hamsters.push(new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel'));
        } else {
          hamsters.wheel.hamsters.push(new Worker(hamsters.wheel.uri));
        }
      }
    }
  }

  function giveHamsterWork() {
    if(hamsters.wheel.env.worker) {
      return workerWorker;
    }
    return worker;
  }

  function createBlob(textContent) {
    if(!self.Blob) {
      self.BlobBuilder = self.BlobBuilder || self.WebKitBlobBuilder || self.MozBlobBuilder || self.MSBlobBuilder;
      var blob = new BlobBuilder();
      blob.append([textContent], {
        type: 'application/javascript'
      });
      return blob.getBlob();
    } 
    return new Blob([textContent], {
      type: 'application/javascript'
    });
  }

  function workerWorker() {
    function processDataType(dataType, buffer) {
      var types = {
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
    self.addEventListener("connect", function(e) {
      var port = e.ports[0];
      port.start();
      port.addEventListener("message", function(e) {
        self.rtn = {
          success: true,
          data: []
        };
        self.params = e.data;
        self.fn = eval("(" + params.fn + ")");
        if (fn) {
          self.fn();
        }
        if(self.params.dataType && self.params.dataType != "na") {
          self.rtn.data = processDataType(self.params.dataType, self.rtn.data);
          self.rtn.dataType = self.params.dataType;
        }
        port.postMessage({
          results: self.rtn
        });
      }, false);
    }, false);
  }

  function worker() {
    function processDataType(dataType, buffer) {
      var types = {
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
        success: true, 
        data: []
      };
      var loopOp = new Function(self.params.fn);
      if(loopOp) {
        loopOp();
      }
      if(self.params.dataType && self.params.dataType != "na") {
        self.rtn.data = processDataType(self.params.dataType, self.rtn.data);
        self.rtn.dataType = self.params.dataType;
        self.postMessage({
          results: self.rtn
        }, [rtn.data.buffer]);
      } else {
        self.postMessage({
          results: self.rtn
        });
      }
    };
  }

  function legacyHamsterWheel(inputArray, hamsterfood, aggregate, callback, task, threadid, hamster, memoize) {
    hamsters.wheel.trackThread(task, hamsters.wheel.queue.running, threadid);
    if(memoize || hamsters.debug) {
      hamsters.wheel.trackInput(inputArray, threadid, task, hamsterfood);
    }
    hamsters.wheel.legacyProcessor(hamsterfood, inputArray, function(output) {
      hamsters.wheel.clean(task, threadid);
      task.output[threadid] = output.data;
      if(task.workers.length === 0 && task.count === task.threads) {
        callback(hamsters.wheel.getOutput(task.output, aggregate, output.dataType));
        hamsters.wheel.tasks[task.id] = null;
        if(hamsters.cache && memoize !== false) {
          hamsters.wheel.memoize(task.fn, task.input, output.data, output.dataType);
        }
      }
    });
    task.count += 1; //Thread finished
  }

  function hamsterWheel(inputArray, hamsterfood, aggregate, callback, task, threadid, hamster, memoize) {
    if(hamsters.maxThreads === hamsters.wheel.queue.running.length) {
      hamsters.wheel.poolThread(inputArray, hamsterfood, threadid, callback, task, aggregate, memoize);
      return;
    }
    if(memoize || hamsters.debug) {
      hamsters.wheel.trackInput(inputArray, threadid, task, hamsterfood);
    }
    if(!hamster) {
      if(hamsters.persistence) {
        hamster = hamsters.wheel.hamsters[hamsters.wheel.queue.running.length];
      } else if(hamsters.wheel.env.ie10) {
        hamster = new Worker('src/common/wheel.min.js');
      } else if(hamsters.wheel.env.worker) {
        hamster = new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel');
      } else {
        hamster = new Worker(hamsters.wheel.uri);
      }
    }
    hamsters.wheel.trainHamster(threadid, aggregate, callback, task, hamster, memoize);
    hamsters.wheel.trackThread(task, hamsters.wheel.queue.running, threadid);
    hamsters.wheel.feedHamster(hamster, hamsterfood, inputArray);
    task.count += 1; //Increment count, thread is running
    if(hamsters.debug === 'verbose') {
      console.info('Spawning Hamster #' + threadid + ' @ ' + new Date().getTime());
    }
  }

  hamsters.tools.splitArray = function(array, chunks) {
    var subArraySize = Math.floor((array.length/chunks));
    var splitArrays = new Array(chunks);
    var sliceIndex = 0;
    var i = 0;
    for (i; i < chunks; i++) {
      if(array.subarray) {
        splitArrays[i] = array.subarray(sliceIndex, sliceIndex += subArraySize);
      }
      if(array.slice) {
        splitArrays[i] = array.slice(sliceIndex, sliceIndex += subArraySize);
      }
    }
    return splitArrays;
  };

  hamsters.tools.loop = function(input, callback) {
    if(!input.array) {
      console.error('Missing data array');
      return;
    }
    var threads = input.threads || 1;
    if(!hamsters.wheel.env.legacy) {
      input.operator = String(input.operator);
      if(!hamsters.wheel.env.worker) {
        input.operator = input.operator.substring(input.operator.indexOf("{")+1, input.operator.length-1);
      }
    }
    var params = {
      run: input.operator,
      init: input.startIndex || 0,
      array: input.array,
      incrementBy: input.incrementBy || 1,
      dataType: input.dataType || null,
      worker: hamsters.wheel.env.worker
    };
    if(threads === 1) {
      params.limit = input.limit || input.array.length;
    } else {
      params.limit = 'compute';
    }
    hamsters.run(params, function() {
      var operator;
      if(params.worker) {
        operator = eval("(" + self.params.run + ")");
      } else {
        operator = new Function(self.params.run);
      }
      if(params.limit === 'compute') {
        params.limit = params.array.length;
      }
      var i = params.init;
      for (i; i < params.limit; i += params.incrementBy) {
        rtn.data.push(operator(params.array[i]));
      }
    }, function(rtn) {
      callback(rtn);
    }, threads, true, input.dataType);
  };

  hamsters.tools.parseJson = function(string, callback) {
    hamsters.run({input: string}, function() {
      rtn.data.push(JSON.parse(params.input));
    }, function(output) {
      callback(output[0]);
    }, 1, true);
  };

  hamsters.tools.stringifyJson = function(json, callback) {
    hamsters.run({input: json}, function() {
      rtn.data.push(JSON.stringify(params.input));
    }, function(output) {
      callback(output[0]);
    }, 1, true);
  };

  hamsters.tools.randomArray = function(count, callback) {
    if(!count || !callback) {
      hamsters.wheel.errors.push({
        msg: 'Unable to generate random array, missing required params'
      });
      return;
    }
    var params = {
      count: count
    };
    hamsters.run(params, function() {
      var i = 0;
      while(i < params.count) {
        rtn.data[rtn.data.length] = Math.round(Math.random() * (100 - 1) + 1);
        i += 1;
      }
    }, callback, 1, false, null, false);
  };

  
  hamsters.tools.aggregate = function(input, dataType) {
    if(!dataType || !hamsters.wheel.env.transferrable) {
      return input.reduce(function(a, b) {
        return a.concat(b);
      });
    }
    var i = 0;
    var len = input.length;
    var bufferLength = 0;
    for (i; i < len; i += 1) {
      bufferLength += input[i].length;
    }
    var output = hamsters.wheel.processDataType(dataType, bufferLength);
    var offset = 0;
    for (i = 0; i < len; i += 1) {
      output.set(input[i], offset);
      offset += input[i].length;
    }
    return output;
  };

  hamsters.wheel.checkCache = function(fn, input, dataType) {
    var cachedResult = hamsters.wheel.cache[fn];
    if(cachedResult) {
      if(cachedResult[0] === input && cachedResult[2] === dataType) {
        return cachedResult;
      }
    }
  };

  hamsters.wheel.memoize = function(fn, inputArray, output, dataType) {
    hamsters.wheel.cache[fn] = [inputArray, output, dataType];
  };

  hamsters.wheel.sort = function(arr, order) {
    if(order === 'desc') {
      return Array.prototype.sort.call(arr, function(a, b) {
        return b - a; 
     });
    } 
    if(order === 'asc') {
      return Array.prototype.sort.call(arr, function(a, b) {
        return a - b; 
     });
    }
    if(order === 'ascAlpha') {
      return arr.sort();
    }
    if(order === 'descAlpha') {
      return arr.reverse();
    }
  };

  hamsters.run = function(params, fn, callback, workers, aggregate, dataType, memoize, order) {
    if(!params || !fn) {
      return 'Error processing for loop, missing params or function';
    }
    workers = workers || 1;
    var task = hamsters.wheel.newTask(hamsters.wheel.tasks.length, workers, order, dataType, fn, callback);
    if(dataType) {
      dataType = dataType.toLowerCase();
    } else {
      dataType = "na";
    }
    if(hamsters.cache && memoize) {
      var result = hamsters.wheel.checkCache(fn, task.input, dataType);
      if(result && callback) {
        setTimeout(function() {
          hamsters.wheel.tasks[taskid] = null; //Clean up our task, not needed any longer
          callback(result);
        }, 4);
        return;
      }
    }
    hamsters.wheel.work(task, params, fn, callback, aggregate, dataType, memoize, order);
  };

  hamsters.wheel.work = function(task, params, fn, callback, aggregate, dataType, memoize, order) {
    var workArray = params.array || null;
    if(params.array && task.threads !== 1) {
      workArray = hamsters.tools.splitArray(params.array, task.threads); //Divide our array into equal array sizes
    }
    if(!hamsters.wheel.env.legacy) {
      params.fn = String(fn);
      if(!hamsters.wheel.env.worker) { //Truncate function string so we can use new Function call instead of eval
        params.fn = params.fn.substring(params.fn.indexOf("{")+1, params.fn.length-1);
      }
    } else {
      params.fn = fn;
    }
    var food = {};
    var key;
    for(key in params) {
      if(params.hasOwnProperty(key) && key !== 'array') {
        food[key] = params[key];
      }
    }
    food.dataType = dataType;
    var i = 0;
    while(i < task.threads) {
      if(workArray && task.threads !== 1) {
        hamsters.wheel.newWheel(workArray[i], food, aggregate, callback, task, task.count, null, memoize);
      } else {
        hamsters.wheel.newWheel(workArray, food, aggregate, callback, task, task.count, null, memoize);
      }
      i += 1;
    }
  };

  hamsters.wheel.newTask = function(taskid, workers, order, dataType, fn, cb) {
    hamsters.wheel.tasks.push({
      id: taskid,
      workers: [],
      count: 0,
      threads: workers, 
      input: [],
      dataType: dataType || null,
      fn: fn,
      output: [], 
      order: order || null,
      callback: cb
    });
    return hamsters.wheel.tasks[taskid];
  };

  hamsters.wheel.trackInput = function(inputArray, threadid, task, hamsterfood) {
    task.input.push({ 
      input: inputArray,
      workerid: threadid, 
      taskid: task.id, 
      params: hamsterfood, 
      start: new Date().getTime()
    });
  };

  hamsters.wheel.trackThread = function(task, running, id) {
    task.workers.push(id); //Keep track of threads scoped to current task
    running.push(id); //Keep track of all currently running threads
  };

  hamsters.wheel.poolThread = function(inputArray, hamsterfood, threadid, cb, task, agg, memoize) {
    hamsters.wheel.queue.pending.push({
      memoize: memoize,
      input: inputArray,
      params: hamsterfood,
      workerid: threadid, 
      callback: cb, 
      task: task,
      aggregate: agg
    });
  };

  hamsters.wheel.legacyProcessor = function(params, inputArray, callback) {
    setTimeout(function() {
      self.rtn = {
        success: true, 
        data: []
      };
      self.params = params;
      self.params.array = inputArray;
      self.params.fn();
      if(self.params.dataType && self.params.dataType != "na") {
        self.rtn.data = hamsters.wheel.processDataType(self.params.dataType, self.rtn.data);
        self.rtn.dataType = self.params.dataType;
      }
      callback(self.rtn);
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  };


  hamsters.wheel.getOutput = function(output, aggregate, dataType) {
    if(aggregate && output.length <= 20) {
      return hamsters.tools.aggregate(output, dataType);
    }
    return output;
  };

  hamsters.wheel.processQueue = function(hamster, item) {
    if(!item) {
      return;
    }
    hamsters.wheel.newWheel(item.input, item.params, item.aggregate, item.callback, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
  };

  hamsters.wheel.clean = function(task, id) {
    hamsters.wheel.queue.running.splice(hamsters.wheel.queue.running.indexOf(id), 1); //Remove thread from running pool
    task.workers.splice(task.workers.indexOf(id), 1); //Remove thread from task running pool
  };

  hamsters.wheel.trainHamster = function(id, aggregate, callback, task, hamster, memoize) {
    function onmessage(e, results) {
      hamsters.wheel.clean(task, id);
      results = e.data.results;
      task.output[id] = results.data;
      if(hamsters.debug === 'verbose') {
        console.info('Hamster #' + id + ' finished ' + '@ ' + e.timeStamp);
      }
      if(task.workers.length === 0 && task.count === task.threads) {
        if(task.order) {
          callback(hamsters.wheel.sort(hamsters.wheel.getOutput(task.output, aggregate, results.dataType), task.order));
        } else {
          callback(hamsters.wheel.getOutput(task.output, aggregate, results.dataType));
        }
        if(hamsters.debug) {
          console.info('Execution Complete! Elapsed: ' + ((e.timeStamp - task.input[0].start)/1000) + 's');
        }
        hamsters.wheel.tasks[task.id] = null; //Clean up our task, not needed any longer
        if(hamsters.cache && memoize) {
          if(task.output[id] && !task.output[id].slice) {
            hamsters.wheel.memoize(task.fn, task.input[0].input, hamsters.wheel.normalizeArray(output), results.dataType);
          } else {
            hamsters.wheel.memoize(task.fn, task.input[0].input, hamsters.wheel.getOutput(task.output, aggregate, results.dataType), results.dataType);
          }
        }
      }
      if(hamsters.wheel.queue.pending.length !== 0) {
        hamsters.wheel.processQueue(hamster, hamsters.wheel.queue.pending.shift());
      } else if(!hamsters.persistence && !hamsters.wheel.env.worker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    }

    function onerror(e) {
      if(!hamsters.wheel.env.worker) {
        hamster.terminate(); //Kill the thread
      }
      hamsters.wheel.errors.push({
        msg: 'Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message
      });
      console.error('Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message);
    }

    if(hamsters.wheel.env.worker) {
      hamster.port.onmessage = onmessage;
      hamster.port.onerror = onerror;
    } else {
      hamster.onmessage = onmessage;
      hamster.onerror = onerror;
    }   
  };

  hamsters.wheel.processData = function(dataType, buffer) {
    var types = {
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
  };

  hamsters.wheel.processDataType = function(dataType, buffer) {
    if(hamsters.wheel.env.transferrable) {
      return hamsters.wheel.processData(dataType, buffer);
    }
    return buffer; //Return normal array if transferrable objects not supported
  };

  hamsters.wheel.feedHamster = function(hamster, food, inputArray) {
    if(hamsters.wheel.env.worker || hamsters.wheel.env.ie10) {
      food.array = inputArray;
      if(hamsters.wheel.env.ie10) {
        food.ie = true;
        hamster.postMessage(food);
      } else {
        hamster.port.postMessage(food);
      }
    } else {
      var key, buffers = [];
      if(inputArray) {
        if(food.dataType && food.dataType != 'na') { //Transferable object transfer if using typed array
          food.array = hamsters.wheel.processDataType(food.dataType, inputArray);
        } else {
          food.array = inputArray;
        }
      }
      for(key in food) {
        if(food.hasOwnProperty(key) && food[key] && food[key].buffer) {
          buffers.push(food[key].buffer);
        }
      }
      hamster.postMessage(food,  buffers);
    }
  };

  setupHamstersEnvironment(function() {
    hamsters.wheel.newWheel = (function() {
      if(hamsters.wheel.env.legacy) {
        return legacyHamsterWheel;
      } else {
        return hamsterWheel;
      }
    })();
    spawnHamsters();
  });
})();

if(typeof module !== 'undefined') {
  module.exports = hamsters;
}