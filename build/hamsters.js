/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var hamsters = {
  version: '4.2.0',
  debug: false,
  cache: false,
  persistence: true,
  maxThreads: 4,
  atomics: false,
  habitat: {
    legacy: false,
    node: false,
    shell: false,
    worker: false,
    browser: false,
    ie10: false,
    atomics: false,
    transferrable: true
  },
  tools: {},
  pool: {
    errors: [],
    tasks: [],
    threads: [],
    running: [],
    pending: []
  },
  uri: null
};

hamsters.init = function (startOptions) {
  setupHamstersEnvironment(startOptions, function () {
    if (hamsters.habitat.legacy) {
      hamsters.pool.newWheel = legacyHamsterWheel;
    } else {
      hamsters.pool.newWheel = hamsterWheel;
      spawnHamsters();
    }
    chewGarbage(startOptions);
  });
  hamsters.run = runHamster;
  hamsters.tools.randomArray = randomArray;
  hamsters.tools.loop = loop;
};

function isIE(version) {
  return new RegExp('msie' + (!isNaN(version) ? '\\s' + version : ''), 'i').test(navigator.userAgent);
}

function setupBrowserSupport() {
  if (!Worker || ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'].indexOf(navigator.userAgent) !== -1) {
    hamsters.habitat.legacy = true;
  }
  if (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
    hamsters.maxThreads = hamsters.maxThreads > 20 ? 20 : hamsters.maxThreads;
  }
  if (isIE(10)) {
    try {
      var testThread = new Worker('src/common/wheel.min.js');
      testThread.terminate();
      hamsters.habitat.ie10 = true;
    } catch (e) {
      hamsters.habitat.legacy = true;
    }
  }
}

function setupWorkerSupport() {
  try {
    var workerBlob = generateWorkerBlob();
    var SharedHamster = new SharedWorker(workerBlob, 'SharedHamsterWheel');
    hamsters.uri = workerBlob;
  } catch (e) {
    hamsters.habitat.legacy = true;
  }
}

function processStartOptions(startOptions) {
  for (var key in startOptions) {
    if (startOptions.hasOwnProperty(key)) {
      hamsters[key] = startOptions[key];
    }
  }
}

function setupHamstersEnvironment(startOptions, onSuccess) {
  hamsters.habitat.browser = (typeof window === 'undefined' ? 'undefined' : _typeof(window)) === "object";
  hamsters.habitat.worker = typeof importScripts === "function";
  hamsters.habitat.node = (typeof process === 'undefined' ? 'undefined' : _typeof(process)) === "object" && typeof require === "function" && !hamsters.habitat.browser && !hamsters.habitat.worker && !hamsters.habitat.reactNative;
  hamsters.habitat.reactNative = !hamsters.habitat.node && (typeof global === 'undefined' ? 'undefined' : _typeof(global)) === 'object';
  hamsters.habitat.shell = !hamsters.habitat.browser && !hamsters.habitat.node && !hamsters.habitat.worker && !hamsters.habitat.reactNative;
  if (typeof navigator !== 'undefined' && typeof navigator.hardwareConcurrency !== 'undefined') {
    hamsters.maxThreads = navigator.hardwareConcurrency;
  }
  if (typeof startOptions !== 'undefined') {
    processStartOptions(startOptions);
  }
  if (hamsters.habitat.browser && !hamsters.habitat.reactNative) {
    setupBrowserSupport();
  }
  if (hamsters.habitat.worker) {
    setupWorkerSupport();
  }
  if (hamsters.habitat.node || hamsters.habitat.reactNative) {
    if (typeof hamsters.Worker !== 'undefined') {
      global.Worker = hamsters.Worker;
    }
  }
  if (hamsters.habitat.shell || typeof Worker === 'undefined') {
    hamsters.habitat.legacy = true;
  }
  if (typeof Uint8Array === 'undefined') {
    hamsters.habitat.transferrable = false;
  }
  if (typeof SharedArrayBuffer !== 'undefined') {
    hamsters.habitat.atomics = true;
  }
  onSuccess();
}

function generateWorkerBlob() {
  return URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + ')();'));
}

function spawnHamsters() {
  if (hamsters.habitat.browser) {
    hamsters.uri = generateWorkerBlob();
  }
  if (hamsters.persistence) {
    var i = hamsters.maxThreads;
    for (i; i > 0; i--) {
      hamsters.pool.threads.push(spawnHamster());
    }
  }
}

function spawnHamster() {
  if (hamsters.habitat.ie10) {
    return new Worker('src/common/wheel.min.js');
  } else if (hamsters.habitat.worker) {
    return new SharedWorker(hamsters.uri, 'SharedHamsterWheel');
  } else if (hamsters.habitat.node) {
    return new Worker(giveHamsterWork());
  } else {
    return new Worker(hamsters.uri);
  }
}

function giveHamsterWork() {
  if (hamsters.habitat.worker) {
    return workerWorker;
  }
  return worker;
}

function createBlob(textContent) {
  if (!Blob) {
    var BlobMaker = BlobBuilder || WebKitBlobBuilder || MozBlobBuilder || MSBlobBuilder;
    var blob = new BlobMaker();
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
  addEventListener("connect", function (e) {
    var port = e.ports[0];
    port.start();
    port.addEventListener("message", function (e) {
      self.params = e.data;
      self.rtn = {
        data: [],
        dataType: params.dataType
      };
      var fn = eval("(" + params.fn + ")");
      if (fn) {
        fn();
      }
      port.postMessage({
        results: rtn
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
    if (!types[dataType]) {
      return buffer;
    }
    return new types[dataType](buffer);
  }

  onmessage = function onmessage(e) {
    self.params = e.data;
    self.rtn = {
      data: [],
      dataType: params.dataType
    };
    var fn = new Function(params.fn);
    if (fn) {
      fn();
    }
    if (params.dataType) {
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

function legacyHamsterWheel(inputArray, hamsterFood, aggregate, onSuccess, task, thread_id, hamster, memoize) {
  trackThread(task, hamsters.pool.running, thread_id);
  if (memoize || hamsters.debug) {
    trackInput(inputArray, thread_id, task, hamsterFood);
  }
  legacyProcessor(hamsterFood, inputArray, function (output) {
    clean(task, thread_id);
    task.output[thread_id] = output.data;
    if (task.workers.length === 0 && task.count === task.threads) {
      onSuccess(getOutput(task.output, aggregate, output.dataType));
      hamsters.pool.tasks[task.id] = null;
      if (hamsters.cache && memoize !== false) {
        memoize(task.fn, task.input, output.data, output.dataType);
      }
    }
  });
  task.count += 1; //Thread finished
}

function hamsterWheel(inputArray, hamsterFood, aggregate, onSuccess, task, thread_id, hamster, memoize) {
  if (hamsters.maxThreads === hamsters.pool.running.length) {
    poolThread(inputArray, hamsterFood, thread_id, onSuccess, task, aggregate, memoize);
    return;
  }
  if (memoize || hamsters.debug) {
    trackInput(inputArray, thread_id, task, hamsterFood);
  }
  if (!hamster) {
    if (hamsters.persistence) {
      hamster = hamsters.pool.threads[hamsters.pool.running.length];
    } else {
      hamster = spawnHamster();
    }
  }
  trainHamster(thread_id, aggregate, onSuccess, task, hamster, memoize);
  trackThread(task, hamsters.pool.running, thread_id);
  hamsterFood.array = inputArray;
  feedHamster(hamster, hamsterFood);
  task.count += 1; //Increment count, thread is running
  if (hamsters.debug === 'verbose') {
    console.info('Spawning Hamster #' + thread_id + ' @ ' + new Date().getTime());
  }
}

function chewGarbage(startOptions) {
  delete hamsters.init;
  startOptions = null;
}

function splitArray(array, n) {
  var i = 0;
  var threadArrays = [];
  var size = Math.ceil(array.length / n);
  if (array.slice) {
    while (i < array.length) {
      threadArrays.push(array.slice(i, i += size));
    }
  } else {
    while (i < array.length) {
      threadArrays.push(array.subarray(i, i += size));
    }
  }
  return threadArrays;
}

function loop(input, onSuccess) {
  var params = {
    run: prepareFunction(input.operator),
    init: input.startIndex || 0,
    limit: input.limit,
    array: input.array,
    incrementBy: input.incrementBy || 1,
    dataType: input.dataType || null,
    worker: hamsters.habitat.worker
  };
  runHamster(params, function () {
    var operator = params.run;
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
  }, function (rtn) {
    onSuccess(rtn);
  }, input.threads, 1, input.dataType);
}

function prepareFunction(functionBody) {
  if (!hamsters.habitat.legacy) {
    functionBody = String(functionBody);
    if (!hamsters.habitat.worker) {
      var startingIndex = functionBody.indexOf("{") + 1;
      var endingIndex = functionBody.length - 1;
      return functionBody.substring(startingIndex, endingIndex);
    }
  }
  return functionBody;
}

function parseJson(string, onSuccess) {
  runHamster({ input: string }, function () {
    rtn.data = JSON.parse(params.input);
  }, function (output) {
    onSuccess(output[0]);
  }, 1);
}

function stringifyJson(json, onSuccess) {
  runHamster({ input: json }, function () {
    rtn.data = JSON.stringify(params.input);
  }, function (output) {
    onSuccess(output[0]);
  }, 1);
}

function randomArray(count, onSuccess) {
  var params = {
    count: count
  };
  runHamster(params, function () {
    while (params.count > 0) {
      rtn.data[rtn.data.length] = Math.round(Math.random() * (100 - 1) + 1);
      params.count -= 1;
    }
  }, function (result) {
    onSuccess(result);
  });
}

function aggregateThreadOutputs(input, dataType) {
  if (!dataType || !hamsters.habitat.transferrable) {
    return input.reduce(function (a, b) {
      return a.concat(b);
    });
  }
  var i = 0;
  var len = input.length;
  var bufferLength = 0;
  for (i; i < len; i += 1) {
    bufferLength += input[i].length;
  }
  var output = processDataType(dataType, bufferLength);
  var offset = 0;
  for (i = 0; i < len; i += 1) {
    output.set(input[i], offset);
    offset += input[i].length;
  }
  return output;
}

function checkCache(fn, input, dataType) {
  var cachedResult = hamsters.cache[fn];
  if (cachedResult) {
    if (cachedResult[0] === input && cachedResult[2] === dataType) {
      return cachedResult;
    }
  }
}

function memoize(fn, inputArray, output, dataType) {
  hamsters.cache[fn] = [inputArray, output, dataType];
}

function sort(arr, order) {
  switch (order) {
    case 'desc':
    case 'asc':
      return Array.prototype.sort.call(arr, function (a, b) {
        return order === 'asc' ? a - b : b - a;
      });
    case 'ascAlpha':
      return arr.sort();
    case 'descAlpha':
      return arr.reverse();
    default:
      return arr;
  }
}

function runHamster(params, fn, onSuccess, workers, aggregate, dataType, memoize, order) {
  if (!params || !fn) {
    return 'Error processing for loop, missing params or function';
  }
  workers = hamsters.habitat.legacy ? 1 : workers || 1;
  var task = newTask(hamsters.pool.tasks.length, workers, order, dataType, fn, onSuccess);
  if (dataType) {
    dataType = dataType.toLowerCase();
  }
  if (hamsters.cache && memoize) {
    var result = checkCache(fn, task.input, dataType);
    if (result && onSuccess) {
      setTimeout(function () {
        hamsters.pool.tasks[taskid] = null; //Clean up our task, not needed any longer
        onSuccess(result);
      }, 4);
      return;
    }
  }
  work(task, params, fn, onSuccess, aggregate, dataType, memoize, order);
}

function work(task, params, fn, onSuccess, aggregate, dataType, memoize, order) {
  var workArray = params.array;
  if (workArray && task.threads !== 1) {
    workArray = splitArray(workArray, task.threads); //Divide our array into equal array sizes
  }
  var food = {};
  var key = void 0;
  for (key in params) {
    if (params.hasOwnProperty(key) && key !== 'array') {
      food[key] = params[key];
    }
  }
  food.fn = prepareFunction(fn);
  food.dataType = dataType;
  var i = 0;
  while (i < task.threads) {
    if (workArray && task.threads !== 1) {
      hamsters.pool.newWheel(workArray[i], food, aggregate, onSuccess, task, task.count, null, memoize);
    } else {
      hamsters.pool.newWheel(workArray, food, aggregate, onSuccess, task, task.count, null, memoize);
    }
    i += 1;
  }
}

function newTask(taskid, workers, order, dataType, fn, cb) {
  hamsters.pool.tasks.push({
    id: taskid,
    workers: [],
    count: 0,
    threads: workers,
    input: [],
    dataType: dataType || null,
    fn: fn,
    output: [],
    order: order || null,
    onSuccess: cb
  });
  return hamsters.pool.tasks[taskid];
}

function assignOutput(task, inputArray) {
  if (!task || !inputArray || !hamsters.habitat.atomics) {
    return;
  }
  task.output = new SharedArrayBuffer(inputArray.length);
}

function trackInput(inputArray, thread_id, task, hamsterFood) {
  task.input.push({
    input: inputArray,
    workerid: thread_id,
    taskid: task.id,
    params: hamsterFood,
    start: new Date().getTime()
  });
}

function trackThread(task, running, id) {
  task.workers.push(id); //Keep track of threads scoped to current task
  running.push(id); //Keep track of all currently running threads
}

function poolThread(inputArray, hamsterFood, thread_id, cb, task, agg, memoize) {
  hamsters.pool.pending.push({
    memoize: memoize,
    input: inputArray,
    params: hamsterFood,
    workerid: thread_id,
    onSuccess: cb,
    task: task,
    aggregate: agg
  });
}

function legacyProcessor(params, inputArray, onSuccess) {
  setTimeout(function () {
    var rtn = {
      success: true,
      data: []
    };
    var params = params;
    params.array = inputArray;
    params.fn();
    if (params.dataType && params.dataType != "na") {
      rtn.data = processDataType(params.dataType, rtn.data);
      rtn.dataType = params.dataType;
    }
    onSuccess(rtn);
  }, 4); //4ms delay (HTML5 spec minimum), simulate threading
}

function getOutput(output, aggregate, dataType) {
  if (aggregate && output.length <= 20) {
    return aggregateThreadOutputs(output, dataType);
  }
  return output;
}

function processQueue(hamster, item) {
  if (!item) {
    return;
  }
  hamsters.pool.newWheel(item.input, item.params, item.aggregate, item.onSuccess, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
}

function clean(task, id) {
  hamsters.pool.running.splice(hamsters.pool.running.indexOf(id), 1); //Remove thread from running pool
  task.workers.splice(task.workers.indexOf(id), 1); //Remove thread from task running pool
}

function trainHamster(id, aggregate, onSuccess, task, hamster, memoize) {
  function onmessage(e, results) {
    clean(task, id);
    results = e.data.results;
    task.output[id] = results.data;
    if (hamsters.debug === 'verbose') {
      console.info('Hamster #' + id + ' finished ' + '@ ' + e.timeStamp);
    }
    if (task.workers.length === 0 && task.count === task.threads) {
      if (task.order) {
        onSuccess(sort(getOutput(task.output, aggregate, results.dataType), task.order));
      } else {
        onSuccess(getOutput(task.output, aggregate, results.dataType));
      }
      if (hamsters.debug) {
        console.info('Execution Complete! Elapsed: ' + (e.timeStamp - task.input[0].start) / 1000 + 's');
      }
      hamsters.pool.tasks[task.id] = null; //Clean up our task, not needed any longer
      if (hamsters.cache && memoize) {
        if (task.output[id] && !task.output[id].slice) {
          memoize(task.fn, task.input[0].input, normalizeArray(output), results.dataType);
        } else {
          memoize(task.fn, task.input[0].input, getOutput(task.output, aggregate, results.dataType), results.dataType);
        }
      }
    }
    if (hamsters.pool.pending.length !== 0) {
      processQueue(hamster, hamsters.pool.pending.shift());
    } else if (!hamsters.persistence && !hamsters.habitat.worker) {
      hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
    }
  };

  function onerror(e) {
    if (!hamsters.habitat.worker) {
      hamster.terminate(); //Kill the thread
    }
    hamsters.pool.errors.push({
      msg: 'Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message
    });
    console.error('Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message);
  };

  if (hamsters.habitat.worker) {
    hamster.port.onmessage = onmessage;
    hamster.port.onerror = onerror;
  } else {
    hamster.onmessage = onmessage;
    hamster.onerror = onerror;
  }
}

function processData(dataType, buffer) {
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
  if (!types[dataType]) {
    return dataType;
  }
  return new types[dataType](buffer);
}

function processDataType(dataType, buffer) {
  if (hamsters.habitat.transferrable) {
    return processData(dataType, buffer);
  }
  return buffer;
}

function feedHamster(hamster, food) {
  if (hamsters.habitat.worker) {
    return hamster.port.postMessage(food);
  }
  if (hamsters.habitat.ie10) {
    return hamster.postMessage(food);
  }
  var buffers = [],
      key = void 0;
  for (key in food) {
    if (food.hasOwnProperty(key) && food[key] && food[key].buffer) {
      buffers.push(food[key].buffer);
    }
  }
  return hamster.postMessage(food, buffers);
}

if (typeof module !== 'undefined') {
  module.exports = hamsters;
}