/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const environment = require('./environment/setup-environment');
const hamsterTools = require("./tools/setup");
const memoizer = require("./cache/memoizer");
const threadPool = require("./pool/thread-pool");
const createBlob = require("./wheel/data/create-blob");
const giveHamsterWork = require("./processor/hamster-worker");
const getOutput = require('./wheel/data/get-output');
const cleanTask = require('./wheel/task/clean-task/');
const feedHamster = require('./wheel/thread/feed-hamster');
const prepareFunction = require('./wheel/task/prepare-function');
const splitArray = hamsterTools.splitArray;
const aggregate = hamsterTools.aggregate;
const sort = hamsterTools.sort;

let threads = [];

const processStartOptions = (startOptions) => {
  for(var key in startOptions) {
    if(startOptions.hasOwnProperty(key)) {
      hamsters[key] = startOptions[key];
    }
  }
}

const spawnHamsters = () => {
  if(environment.browser) {
    var uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + ')();'));
  }
  if(environment.persistence) {
    var i = environment.maxThreads;
    for (i; i > 0; i--) {
      if(environment.ie10) {
        threads.push(new Worker('./common/wheel.min.js'));
      } else if(environment.node) {
        threads.push(new Worker(giveHamsterWork()));
      } else if(environment.worker) {
        threads.push(new SharedWorker(uri, 'SharedHamsterWheel'));
      } else {
        threads.push(new Worker(uri));
      }
    }
  }
}

const workerWorker = () => {
  addEventListener("connect", function(e) {
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
        self.rtn.data = self.processDataType(self.params.dataType, self.rtn.data);
        self.rtn.dataType = self.params.dataType;
      }
      port.postMessage({
        results: self.rtn
      });
    }, false);
  }, false);
}

const worker = () => {
  const processDataType = (dataType, buffer) => {
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
  onmessage = (e) => {
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

const legacyHamsterWheel = (inputArray, hamsterFood, aggregate, onSuccess, task, threadId, hamster, memoize) => {
  trackThread(task, queue.running, threadId);
  if(memoize || hamsters.debug) {
    trackInput(inputArray, threadId, task, hamsterFood);
  }
  legacyProcessor(hamsterFood, inputArray, function(output) {
    clean(task, threadId);
    task.output[threadId] = output.data;
    if(task.workers.length === 0 && task.count === task.threads) {
      onSuccess(getOutput(task.output, aggregate, output.dataType));
      tasks[task.id] = null;
      if(hamsters.cache && memoize !== false) {
        memoize(task.fn, task.input, output.data, output.dataType);
      }
    }
  });
  task.count += 1; //Thread finished
}

const hamsterWheel = (inputArray, hamsterFood, aggregate, onSuccess, task, threadId, hamster, memoize) => {
    // hamsterFood.array = inputArray;

  if(hamsters.maxThreads === queue.running.length) {
    poolThread(inputArray, hamsterFood, threadId, onSuccess, task, aggregate, memoize);
    return;
  }
  if(memoize || hamsters.debug) {
    trackInput(inputArray, threadId, task, hamsterFood);
  }
  if(!hamster) {
    if(hamsters.persistence) {
      hamster = hamsters[queue.running.length];
    } else {
      if(environment.ie10) {
        hamster = new Worker('src/common/wheel.min.js');
      } else if(environment.worker) {
        hamster = new SharedWorker(uri, 'SharedHamsterWheel');
      } else if (environment.node) {
        hamster = new Worker(giveHamsterWork());
      } else {
        hamster = new Worker(uri);
      }
    }
  }
  trainHamster(threadId, aggregate, onSuccess, task, hamster, memoize);
  trackThread(task, queue.running, threadId);
  feedHamster(hamster, hamsterFood);
  task.count += 1; //Increment count, thread is running
  if(hamsters.debug === 'verbose') {
    console.info('Spawning Hamster #' + threadId + ' @ ' + new Date().getTime());
  }
}

const loop = (input, onSuccess) => {
  var params = {
    run: prepareFunction(input.operator),
    init: input.startIndex || 0,
    limit: input.limit,
    array: input.array,
    incrementBy: input.incrementBy || 1,
    dataType: input.dataType || null,
    worker: env.worker
  };
  run(params, function() {
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
  }, function(rtn) {
    onSuccess(rtn);
  }, input.threads, 1, input.dataType);
};

const checkCache = (fn, input, dataType) => {
  var cachedResult = cache[fn];
  if(cachedResult) {
    if(cachedResult[0] === input && cachedResult[2] === dataType) {
      return cachedResult;
    }
  }
};

const memoize = (fn, inputArray, output, dataType) => {
  hamsters.cache[fn] = [inputArray, output, dataType];
};


const run = (params, fn, onSuccess, workers, aggregate, dataType, memoize, order) => {
  if(!params || !fn) {
    return 'Error processing for loop, missing params or function';
  }
  workers = (environment.legacy ? 1 : (workers || 1));
  var task = newTask(tasks.length, workers, order, dataType, fn, onSuccess);
  if(dataType) {
    dataType = dataType.toLowerCase();
  }
  if(hamsters.cache && memoize) {
    var result = checkCache(fn, task.input, dataType);
    if(result && onSuccess) {
      setTimeout(function() {
        tasks[taskid] = null; //Clean up our task, not needed any longer
        onSuccess(result);
      }, 4);
      return;
    }
  }
  work(task, params, fn, onSuccess, aggregate, dataType, memoize, order);
};

const prepareMeal = (params, fn, dataType) => {
  var food = {};
  var key;
  for(key in params) {
    if(params.hasOwnProperty(key) && key !== 'array') {
      food[key] = params[key];
    }
  }
  food.fn = prepareFunction(fn);
  food.dataType = dataType;
  return food;
};
 
const work = (task, params, fn, onSuccess, aggregate, dataType, memoize, order) => {
  var workArray = params.array;
  if(workArray && task.threads !== 1) {
    workArray = splitArray(workArray, task.threads); //Divide our array into equal array sizes
  }
  var food = prepareMeal(params, fn, dataType);
  var i = 0;
  while(i < task.threads) {
    if(workArray && task.threads !== 1) {
      newWheel(workArray[i], food, aggregate, onSuccess, task, task.count, null, memoize);
    } else {
      newWheel(workArray, food, aggregate, onSuccess, task, task.count, null, memoize);
    }
    i += 1;
  }
};

const assignOutput = (task, inputArray) => {
  if(!task || !inputArray || !environment.atomics) {
    return;
  }
  task.output = new SharedArrayBuffer(inputArray.length);
};

const trackInput = (inputArray, threadId, task, hamsterFood) => {
  task.input.push({ 
    input: inputArray,
    workerid: threadId, 
    taskid: task.id, 
    params: hamsterFood, 
    start: new Date().getTime()
  });
};

const trackThread = (task, running, id) => {
  task.workers.push(id); //Keep track of threads scoped to current task
  running.push(id); //Keep track of all currently running threads
};

const poolThread = (inputArray, hamsterFood, threadId, cb, task, agg, memoize) => {
  queue.pending.push({
    memoize: memoize,
    input: inputArray,
    params: hamsterFood,
    workerid: threadId, 
    onSuccess: cb, 
    task: task,
    aggregate: agg
  });
};

const legacyProcessor = (params, inputArray, onSuccess) => {
  setTimeout(function() {
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
    onSuccess(self.rtn);
  }, 4); //4ms delay (HTML5 spec minimum), simulate threading
};

const processQueue = (hamster, item) => {
  if(!item) {
    return;
  }
  newWheel(item.input, item.params, item.aggregate, item.onSuccess, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
};


const trainHamster = (id, aggregate, onSuccess, task, hamster, memoize) => {
  let onmessage = (e, results) => {
    clean(task, id);
    results = e.data.results;
    task.output[id] = results.data;
    if(hamsters.debug === 'verbose') {
      console.info('Hamster #' + id + ' finished ' + '@ ' + e.timeStamp);
    }
    if(task.workers.length === 0 && task.count === task.threads) {
      if(task.order) {
        onSuccess(sort(getOutput(task.output, aggregate, results.dataType), task.order));
      } else {
        onSuccess(getOutput(task.output, aggregate, results.dataType));
      }
      // if(hamsters.debug) { Revisit, completely inaccurate!!!
      //   console.info('Execution Complete! Elapsed: ' + ( (e.timeStamp - task.input[0].start) / 1000) + 's');
      // }
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
    } else if(!hamsters.persistence && !environment.worker) {
      hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
    }
  }

  let onerror = (e) => {
    if(!environment.worker) {
      hamster.terminate(); //Kill the thread
    }
    errors.push({
      msg: 'Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message
    });
    console.error('Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message);
  }

  if(environment.worker) {
    hamster.port.onmessage = onmessage;
    hamster.port.onerror = onerror;
  } else {
    hamster.onmessage = onmessage;
    hamster.onerror = onerror;
  }   
};

const processData = (dataType, buffer) => {
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

const processDataType = (dataType, buffer) => {
  if(environment.transferrable) {
    return processData(dataType, buffer);
  }
  return buffer;
};

self.hamsters = {
  version: '4.1.4',
  init: (startOptions) => {
    processStartOptions(startOptions);
    if(environment.legacy) {
      var newWheel = legacyHamsterWheel;
    } else {
      var newWheel = hamsterWheel;
      spawnHamsters();
    }
  },
  debug: false,
  cache: false,
  persistence: true,
  maxThreads: 4,
  habitat: environment,
  atomics: false,
  tools: hamsterTools(),
  wheel: {
    cache: {},
    hamsters: threads, 
    errors: [],
    uri: null
  }
};


module.exports = hamsters;


