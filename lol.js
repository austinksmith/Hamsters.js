(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (process,global){
/*
* Title: WebHamsters
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const hamsters = {

  version: false,
  debug: false,
  cache: false,
  persistence: false,
  maxThreads: 4,
  tools: require("./hamsters_tools.js"),
  wheel: require("./hamsters_wheel.js"),

  init: (startOptions) => {
    "use strict";

    function isIE(version) {
      return (new RegExp("msie" + (!Number.isNaN(version) ? ("\\s"+version) : ""), "i").test(navigator.userAgent));
    }

    function setupBrowserSupport() {
      if(!Worker || ["Kindle/3.0", "Mobile/8F190", "IEMobile"].indexOf(navigator.userAgent) !== -1) {
        hamsters.wheel.env.legacy = true;
      }
      if(navigator.userAgent.toLowerCase().indexOf("firefox") !== -1) {
        hamsters.maxThreads = (hamsters.maxThreads > 20 ? 20 : hamsters.maxThreads);
      }
      if(isIE(10)) {
        try {
          let hamster = new Worker("src/common/hamsters.wheel.min.js");
          hamster.terminate();
          hamsters.wheel.env.ie10 = true;
        } catch(e) {
          hamsters.wheel.env.legacy = true;
        }
      }
    }

    function setupWorkerSupport() {
      try {
        hamsters.wheel.uri = URL.createObjectURL(createBlob("(" + String(giveHamsterWork()) + "());"));
        const SharedHamster = new SharedWorker(hamsters.wheel.uri, "SharedHamsterWheel");
        SharedHamster.terminate();
      } catch(e) {
        hamsters.wheel.env.legacy = true;
      }
    }

    function processStartOptions() {
      let key;
      for(key in startOptions) {
        if(startOptions.hasOwnProperty(key)) {
          this[key] = startOptions[key];
        }
      }
    }

    function setupHamstersEnvironment(onSuccess) {
      hamsters.wheel.env.browser = typeof window === "object";
      hamsters.wheel.env.worker  = typeof importScripts === "function";
      hamsters.wheel.env.node = typeof process === "object" && typeof require === "function" && !hamsters.wheel.env.browser && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
      hamsters.wheel.env.reactNative = !hamsters.wheel.env.node && typeof global === "object";
      hamsters.wheel.env.shell = !hamsters.wheel.env.browser && !hamsters.wheel.env.node && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
      if(typeof navigator !== "undefined") {
        hamsters.maxThreads = navigator.hardwareConcurrency;
      }
      if(typeof startOptions !== "undefined") {
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
      if(hamsters.wheel.env.shell || typeof Worker === "undefined") {
        hamsters.wheel.env.legacy = true;
      }
      if(typeof Uint8Array === "undefined") {
        hamsters.wheel.env.transferrable = false;
      }
      onSuccess();
    }

    function spawnHamsters() {
      if(typeof URL !== "undefined") {
        hamsters.wheel.uri = URL.createObjectURL(createBlob("(" + String(giveHamsterWork()) + ")();"));
      }
      if(hamsters.persistence) {
        let i = hamsters.maxThreads;
        for (i; i > 0; i--) {
          hamsters.wheel.hamsters.push(hamsters.wheel.newHamster());
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
        const blob = new BlobBuilder();
        blob.append([textContent], {
          type: "application/javascript"
        });
        return blob.getBlob();
      }
      return new Blob([textContent], {
        type: "application/javascript"
      });
    }

    function workerWorker() {
      self.addEventListener("connect", (e) => {
        let port = e.ports[0];
        port.start();
        port.addEventListener("message", (e) => {
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
        const types = {
          "uint32": Uint32Array,
          "uint16": Uint16Array,
          "uint8": Uint8Array,
          "uint8clamped": Uint8ClampedArray,
          "int32": Int32Array,
          "int16": Int16Array,
          "int8": Int8Array,
          "float32": Float32Array,
          "float64": Float64Array
        };
        if(!types[dataType]) {
          return buffer;
        }
        return new types[dataType](buffer);
      }
      self.onmessage = (e) => {
        self.params = e.data;
        self.rtn = {
          data: [],
          dataType: self.params.dataType
        };
        let fn = new Function(self.params.fn);
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
      hamsters.wheel.legacyProcessor((hamsterfood, inputArray, output) => {
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
        } else {
          hamster = hamsters.wheel.newHamster();
        }
      }
      hamsters.wheel.trainHamster(threadid, aggregate, callback, task, hamster, memoize);
      hamsters.wheel.trackThread(task, hamsters.wheel.queue.running, threadid);
      hamsterfood.array = inputArray;
      hamsters.wheel.feedHamster(hamster, hamsterfood);
      task.count += 1; //Increment count, thread is running
      if(hamsters.debug === "verbose") {
        console.info("Spawning Hamster #" + threadid + " @ " + new Date().getTime());
      }
    }

    function chewGarbage() {
      delete hamsters.init;
      startOptions = null;
    }

    setupHamstersEnvironment(() => {
      if(hamsters.wheel.env.legacy) {
        hamsters.wheel.newWheel = legacyHamsterWheel;
      } else {
        hamsters.wheel.newWheel = hamsterWheel;
        spawnHamsters();
      }
      chewGarbage();
    });
  }
};

exports.hamsters = hamsters;
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./hamsters_tools.js":2,"./hamsters_wheel.js":3,"_process":4}],2:[function(require,module,exports){
"use strict";

const hamstersTools = {

  splitArray: (array, n) => {
    let i = 0;
    let tasks = [];
    let size = Math.ceil(array.length/n);
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
  },

  loop: (input, onSuccess) => {
    let params = {
      run: prepareFunction(input.operator),
      init: input.startIndex || 0,
      limit: input.limit,
      array: input.array,
      incrementBy: input.incrementBy || 1,
      dataType: input.dataType || null,
      worker: hamsters.wheel.env.worker
    };
    hamsters.run(params, () => {
      let operator = self.params.run;
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
      let i = params.init;
      for (i; i < params.limit; i += params.incrementBy) {
        rtn.data[i] = operator(params.array[i]);
      }
    }, (output) => {
      onSuccess(output);
    }, input.threads, 1, input.dataType);
  },

  prepareFunction: (functionBody) => {
    if(!hamsters.wheel.env.legacy) {
      functionBody = String(functionBody);
      if(!hamsters.wheel.env.worker) {
        let startingIndex = (functionBody.indexOf("{") + 1);
        let endingIndex = (functionBody.length - 1);
        return functionBody.substring(startingIndex, endingIndex);
      }
    }
    return functionBody;
  },

  parseJson: (string, onSuccess) => {
    hamsters.run({input: string}, () => {
      rtn.data = JSON.parse(params.input);
    }, (output) => {
      onSuccess(output[0]);
    }, 1);
  },

  stringifyJson: (json, onSuccess) => {
    hamsters.run({input: json}, () => {
      rtn.data = JSON.stringify(params.input);
    }, (output) => {
      onSuccess(output);
    }, 1);
  },

  randomArray: (count, onSuccess) => {
    let params = {
      count: count
    };
    hamsters.run(params, () => {
      while(params.count > 0) {
        rtn.data[rtn.data.length] = Math.round(Math.random() * (100 - 1) + 1);
        params.count -= 1;
      }
    }, (output) => {
      onSuccess(output);
    });
  },

  aggregate: (input, dataType) => {
    if(!dataType || !hamsters.wheel.env.transferrable) {
      return input.reduce((a, b) => a.concat(b));
    }
    let i = 0;
    let len = input.length;
    let bufferLength = 0;
    for (i; i < len; i += 1) {
      bufferLength += input[i].length;
    }
    let output = hamsters.wheel.processDataType(dataType, bufferLength);
    let offset = 0;
    for (i = 0; i < len; i += 1) {
      output.set(input[i], offset);
      offset += input[i].length;
    }
    return output;
  }
};

exports.hamstersTools = hamstersTools;

},{}],3:[function(require,module,exports){
"use strict";

const hamstersWheel = {

  env: Object.create({
    legacy: false,
    node: false,
    shell: false,
    worker: false,
    browser: false,
    ie10: false,
    transferrable: true
  }),
  queue: Object.create({
    running: [],
    pending: []
  }),
  cache: Object.create({}),
  hamsters: [],
  tasks: [],
  errors: [],
  uri: null,

  newHamster: () => {
    if(env.worker) {
      return new SharedWorker(uri, "SharedHamsterWheel");
    }
    if(env.ie10) {
      return new Worker("src/common/wheel.min.js");
    }
    return new Worker(uri);
  },

  checkCache: (fn, input, dataType) => {
    let cachedResult = cache[fn];
    if(cachedResult) {
      if(cachedResult[0] === input && cachedResult[2] === dataType) {
        return cachedResult;
      }
    }
  },

  memoize: (fn, inputArray, output, dataType) => {
    cache[fn] = [inputArray, output, dataType];
  },

  sort: (arr, order) => {
    switch(order) {
      case "desc":
      case "asc":
        return Array.prototype.sort.call(arr, (a, b) => order === "asc" ? (a - b) : (b - a));
      case "ascAlpha":
        return arr.sort();
      case "descAlpha":
        return arr.reverse();
      default:
        return arr;
    }
  },
  
  work: (task, params, fn, callback, aggregate, dataType, memoize, order) => {
    let workArray = params.array || null;
    if(params.array && task.threads !== 1) {
      workArray = hamsters.tools.splitArray(params.array, task.threads); //Divide our array into equal array sizes
    }
    let food = {};
    let key;
    for(key in params) {
      if(params.hasOwnProperty(key) && key !== "array") {
        food[key] = params[key];
      }
    }
    food.fn = hamsters.tools.prepareFunction(fn);
    food.dataType = dataType;
    let i = 0;
    while(i < task.threads) {
      if(workArray && task.threads !== 1) {
        newWheel(workArray[i], food, aggregate, callback, task, task.count, null, memoize);
      } else {
        newWheel(workArray, food, aggregate, callback, task, task.count, null, memoize);
      }
      i += 1;
    }
  },

  newTask: (taskid, workers, order, dataType, fn, cb) => {
    tasks.push({
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
    return tasks[taskid];
  },

  trackInput: (inputArray, threadid, task, hamsterfood) => {
    task.input.push({ 
      input: inputArray,
      workerid: threadid, 
      taskid: task.id, 
      params: hamsterfood, 
      start: new Date().getTime()
    });
  },

  trackThread: (task, running, id) => {
    task.workers.push(id); //Keep track of threads scoped to current task
    running.push(id); //Keep track of all currently running threads
  },

  poolThread: (inputArray, hamsterfood, threadid, cb, task, agg, memoize) => {
    queue.pending.push({
      memoize: memoize,
      input: inputArray,
      params: hamsterfood,
      workerid: threadid, 
      callback: cb, 
      task: task,
      aggregate: agg
    });
  },

  legacyProcessor: (params, inputArray, callback) => {
    setTimeout(() => {
      self.rtn = {
        success: true, 
        data: []
      };
      self.params = params;
      self.params.array = inputArray;
      self.params.fn();
      if(self.params.dataType && self.params.dataType != "na") {
        self.rtn.data = processDataType(self.params.dataType, self.rtn.data);
        self.rtn.dataType = self.params.dataType;
      }
      callback(self.rtn);
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  },

  getOutput: (output, aggregate, dataType) => {
    if(aggregate && output.length <= 20) {
      return hamsters.tools.aggregate(output, dataType);
    }
    return output;
  },

  processQueue: (hamster, item) => {
    if(!item) {
      return;
    }
    newWheel(item.input, item.params, item.aggregate, item.callback, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
  },

  clean: (task, id) => {
    queue.running.splice(queue.running.indexOf(id), 1); //Remove thread from running pool
    task.workers.splice(task.workers.indexOf(id), 1); //Remove thread from task running pool
  },

  trainHamster: (id, aggregate, callback, task, hamster, memoize) => {
    function onmessage(e, results) {
      clean(task, id);
      results = e.data.results;
      task.output[id] = results.data;
      if(hamsters.debug === "verbose") {
        console.info("Hamster #" + id + " finished " + "@ " + e.timeStamp);
      }
      if(task.workers.length === 0 && task.count === task.threads) {
        if(task.order) {
          callback(sort(getOutput(task.output, aggregate, results.dataType), task.order));
        } else {
          callback(getOutput(task.output, aggregate, results.dataType));
        }
        if(hamsters.debug) {
          console.info("Execution Complete! Elapsed: " + ((e.timeStamp - task.input[0].start)/1000) + "s");
        }
        tasks[task.id] = null; //Clean up our task, not needed any longer
        if(hamsters.cache && memoize) {
          if(task.output[id] && !task.output[id].slice) {
            memoize(task.fn, task.input[0].input, normalizeArray(output), results.dataType);
          } else {
            memoize(task.fn, task.input[0].input, getOutput(task.output, aggregate, results.dataType), results.dataType);
          }
        }
      }
      if(queue.pending.length !== 0) {
        processQueue(hamster, queue.pending.shift());
      } else if(!hamsters.persistence && !env.worker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    }

    function onerror(e) {
      if(!env.worker) {
        hamster.terminate(); //Kill the thread
      }
      errors.push({
        msg: "Error Hamster #" + id + ": Line " + e.lineno + " in " + e.filename + ": " + e.message
      });
      console.error("Error Hamster #" + id + ": Line " + e.lineno + " in " + e.filename + ": " + e.message);
    }

    if(env.worker) {
      hamster.port.onmessage = onmessage;
      hamster.port.onerror = onerror;
    } else {
      hamster.onmessage = onmessage;
      hamster.onerror = onerror;
    }   
  },

  processData: (dataType, buffer) => {
    let types = {
      "uint32": Uint32Array,
      "uint16": Uint16Array,
      "uint8": Uint8Array,
      "uint8clamped": Uint8ClampedArray,
      "int32": Int32Array,
      "int16": Int16Array,
      "int8": Int8Array,
      "float32": Float32Array,
      "float64": Float64Array
    };
    if(!types[dataType]) {
      return dataType;
    }
    return new types[dataType](buffer);
  },

  processDataType: (dataType, buffer) => {
    if(env.transferrable) {
      return processData(dataType, buffer);
    }
    return buffer;
  },

  feedHamster: (hamster, food) => {
    if(env.worker) {
      return hamster.port.postMessage(food);
    }
    if(env.ie10) {
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
};

exports.hamstersWheel = hamstersWheel;
},{}],4:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}]},{},[1]);
