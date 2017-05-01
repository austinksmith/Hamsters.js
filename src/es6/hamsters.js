/*
* Title: WebHamsters
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

var hamsters = {
  version: '4.1.1',
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

hamsters.init = startOptions => {
  "use strict";

  function isIE(version) {
    return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
  }

  function setupBrowserSupport() {
    if(!Worker || ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'].indexOf(navigator.userAgent) !== -1) {
      hamsters.wheel.env.legacy = true;
    }
    if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
      hamsters.maxThreads = (hamsters.maxThreads > 20 ? 20 : hamsters.maxThreads);
    }
    if(isIE(10)) {
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

  function processStartOptions() {
    for(var key in hamsters) {
      if(hamsters.hasOwnProperty(key)) {
        hamsters[key] = startOptions[key] || hamsters[key];
      }
    }
  }

  function setupHamstersEnvironment(onSuccess) {
    hamsters.wheel.env.browser = typeof window === "object";
    hamsters.wheel.env.worker  = typeof importScripts === "function";
    hamsters.wheel.env.node = typeof process === "object" && typeof require === "function" && !hamsters.wheel.env.browser && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
    hamsters.wheel.env.reactNative = !hamsters.wheel.env.node && typeof global === 'object';
    hamsters.wheel.env.shell = !hamsters.wheel.env.browser && !hamsters.wheel.env.node && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
    if(typeof navigator !== 'undefined') {
      hamsters.maxThreads = navigator.hardwareConcurrency;
    }
    if(typeof startOptions !== 'undefined') {
      processStartOptions();
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
    onSuccess();
  }

  function spawnHamsters() {
    if(hamsters.wheel.env.browser) {
      hamsters.wheel.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + ')();'));
    }
    if(hamsters.persistence) {
      var i = hamsters.maxThreads;
      for (i; i > 0; i--) {
        if(hamsters.wheel.env.ie10) {
          hamsters.wheel.hamsters.push(new Worker('src/common/wheel.min.js'));
        }
        if(hamsters.wheel.env.worker) {
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
    self.addEventListener("connect", e => {
      var port = e.ports[0];
      port.start();
      port.addEventListener("message", e => {
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
          self.rtn.data = self.processDataType(self.params.dataType, self.rtn.data);
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
    }
    self.onmessage = e => {
      self.params = e.data;
      self.rtn = {
        data: [],
        dataType: self.params.dataType
      };
      var fn = new Function(self.params.fn);
      if(fn) {
        fn();
      }
      if(self.params.dataType) {
        self.rtn.data = processDataType(self.params.dataType, self.rtn.data);
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
    hamsters.wheel.legacyProcessor(hamsterfood, inputArray, output => {
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
    hamsterfood.array = inputArray;
    hamsters.wheel.feedHamster(hamster, hamsterfood);
    task.count += 1; //Increment count, thread is running
    if(hamsters.debug === 'verbose') {
      console.info('Spawning Hamster #' + threadid + ' @ ' + new Date().getTime());
    }
  }

  function chewGarbage() {
    delete hamsters.init;
    startOptions = null;
  }

  hamsters.tools.splitArray = (array, n) => {
    var i = 0;
    var tasks = [];
    var size = Math.ceil(array.length/n);
    if(array.slice) {
      while(i < array.length) {
        tasks.push(array.slice(i, i += size));
      }
    } else {
      while (i < array.length) {
        tasks.push(array.subarray(i, i += size));
      }
    }
    return tasks;
  };

  hamsters.tools.loop = (input, onSuccess) => {
    var params = {
      run: hamsters.tools.prepareFunction(input.operator),
      init: input.startIndex || 0,
      limit: input.limit,
      array: input.array,
      incrementBy: input.incrementBy || 1,
      dataType: input.dataType || null,
      worker: hamsters.wheel.env.worker
    };
    hamsters.run(params, () => {
      var operator = self.params.run;
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
    }, rtn => {
      onSuccess(rtn);
    }, input.threads, 1, input.dataType);
  };

  hamsters.tools.prepareFunction = functionBody => {
    if(!hamsters.wheel.env.legacy) {
      functionBody = String(functionBody);
      if(!hamsters.wheel.env.worker) {
        var startingIndex = (functionBody.indexOf("{") + 1);
        var endingIndex = (functionBody.length - 1);
        return functionBody.substring(startingIndex, endingIndex);
      }
    }
    return functionBody;
  };

  hamsters.tools.parseJson = (string, onSuccess) => {
    hamsters.run({input: string}, () => {
      rtn.data = JSON.parse(params.input);
    }, output => {
      onSuccess(output[0]);
    }, 1);
  };

  hamsters.tools.stringifyJson = (json, onSuccess) => {
    hamsters.run({input: json}, () => {
      rtn.data = JSON.stringify(params.input);
    }, output => {
      onSuccess(output[0]);
    }, 1);
  };

  hamsters.tools.randomArray = (count, onSuccess) => {
    var params = {
      count: count
    };
    hamsters.run(params, () => {
      while(params.count > 0) {
        rtn.data[rtn.data.length] = Math.round(Math.random() * (100 - 1) + 1);
        params.count -= 1;
      }
    }, result => {
      onSuccess(result);
    });
  };

  hamsters.tools.aggregate = (input, dataType) => {  
    if(!dataType || !hamsters.wheel.env.transferrable) {
      return input.reduce((a, b) => a.concat(b));
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

  hamsters.wheel.checkCache = (fn, input, dataType) => {
    var cachedResult = hamsters.wheel.cache[fn];
    if(cachedResult) {
      if(cachedResult[0] === input && cachedResult[2] === dataType) {
        return cachedResult;
      }
    }
  };

  hamsters.wheel.memoize = (fn, inputArray, output, dataType) => {
    hamsters.wheel.cache[fn] = [inputArray, output, dataType];
  };

  hamsters.wheel.sort = (arr, order) => {
    switch(order) {
      case 'desc':
      case 'asc':
        return Array.prototype.sort.call(arr, (a, b) => order === 'asc' ? (a - b) : (b - a));
      case 'ascAlpha':
        return arr.sort();
      case 'descAlpha':
        return arr.reverse();
      default:
        return arr;
    }
  };

  hamsters.run = (params, fn, callback, workers, aggregate, dataType, memoize, order) => {
    if(!params || !fn) {
      return 'Error processing for loop, missing params or function';
    }
    workers = (hamsters.wheel.env.legacy ? 1 : (workers || 1));
    var task = hamsters.wheel.newTask(hamsters.wheel.tasks.length, workers, order, dataType, fn, callback);
    if(dataType) {
      dataType = dataType.toLowerCase();
    }
    if(hamsters.cache && memoize) {
      var result = hamsters.wheel.checkCache(fn, task.input, dataType);
      if(result && callback) {
        setTimeout(() => {
          hamsters.wheel.tasks[taskid] = null; //Clean up our task, not needed any longer
          callback(result);
        }, 4);
        return;
      }
    }
    hamsters.wheel.work(task, params, fn, callback, aggregate, dataType, memoize, order);
  };

  hamsters.wheel.work = (task, params, fn, callback, aggregate, dataType, memoize, order) => {
    var workArray = params.array || null;
    if(params.array && task.threads !== 1) {
      workArray = hamsters.tools.splitArray(params.array, task.threads); //Divide our array into equal array sizes
    }
    var food = {};
    var key;
    for(key in params) {
      if(params.hasOwnProperty(key) && key !== 'array') {
        food[key] = params[key];
      }
    }
    food.fn = hamsters.tools.prepareFunction(fn);
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

  hamsters.wheel.newTask = (taskid, workers, order, dataType, fn, cb) => {
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

  hamsters.wheel.trackInput = (inputArray, threadid, task, hamsterfood) => {
    task.input.push({ 
      input: inputArray,
      workerid: threadid, 
      taskid: task.id, 
      params: hamsterfood, 
      start: new Date().getTime()
    });
  };

  hamsters.wheel.trackThread = (task, running, id) => {
    task.workers.push(id); //Keep track of threads scoped to current task
    running.push(id); //Keep track of all currently running threads
  };

  hamsters.wheel.poolThread = (inputArray, hamsterfood, threadid, cb, task, agg, memoize) => {
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

  hamsters.wheel.legacyProcessor = (params, inputArray, callback) => {
    setTimeout(() => {
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


  hamsters.wheel.getOutput = (output, aggregate, dataType) => {
    if(aggregate && output.length <= 20) {
      return hamsters.tools.aggregate(output, dataType);
    }
    return output;
  };

  hamsters.wheel.processQueue = (hamster, item) => {
    if(!item) {
      return;
    }
    hamsters.wheel.newWheel(item.input, item.params, item.aggregate, item.callback, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
  };

  hamsters.wheel.clean = (task, id) => {
    hamsters.wheel.queue.running.splice(hamsters.wheel.queue.running.indexOf(id), 1); //Remove thread from running pool
    task.workers.splice(task.workers.indexOf(id), 1); //Remove thread from task running pool
  };

  hamsters.wheel.trainHamster = (id, aggregate, callback, task, hamster, memoize) => {
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

  hamsters.wheel.processData = (dataType, buffer) => {
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

  hamsters.wheel.processDataType = (dataType, buffer) => {
    if(hamsters.wheel.env.transferrable) {
      return hamsters.wheel.processData(dataType, buffer);
    }
    return buffer;
  };

  hamsters.wheel.feedHamster = (hamster, food) => {
    if(hamsters.wheel.env.worker) {
      return hamster.port.postMessage(food);
    }
    if(hamsters.wheel.env.ie10) {
      return hamster.postMessage(food);
    }
    var buffers = [], key;
    for(key in food) {
      if(food.hasOwnProperty(key) && food[key] && food[key].buffer) {
        buffers.push(food[key].buffer);
      }
    }
    return hamster.postMessage(food,  buffers);
  };

  setupHamstersEnvironment(() => {
    if(hamsters.wheel.env.legacy) {
      hamsters.wheel.newWheel = legacyHamsterWheel;
    } else {
      hamsters.wheel.newWheel = hamsterWheel;
      spawnHamsters();
    }
    chewGarbage();
  });
};

if(typeof module !== 'undefined') {
  module.exports = hamsters;
}