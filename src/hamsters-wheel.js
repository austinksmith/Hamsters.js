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

module.exports = hamstersWheel;