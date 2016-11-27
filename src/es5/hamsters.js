/*
* Title: WebHamsters
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

var hamsters = {
    version: '3.9.6',
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

  /**
   * @description: Detect Internet Explorer by Version IE10 and below
   * @method isIE
   * @param {integer} version
   * @return CallExpression
   */
  var isIE = function(version) {
    return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
  };

  /**
   * Description
   * @description: Detect support for web workers
   * @method setupEnv
   * @return
   */
  var setupEnv = function(callback) {
    hamsters.wheel.env.browser = typeof window === "object";
    hamsters.wheel.env.worker  = typeof importScripts === "function";
    hamsters.wheel.env.node = typeof process === "object" && typeof require === "function" && !hamsters.wheel.env.browser && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
    hamsters.wheel.env.reactNative = !hamsters.wheel.env.node && typeof global === 'object';
    hamsters.wheel.env.shell = !hamsters.wheel.env.browser && !hamsters.wheel.env.node && !hamsters.wheel.env.worker && !hamsters.wheel.env.reactNative;
    if(hamsters.wheel.env.reactNative) {
      global.self = global;
    }
    if(hamsters.wheel.env.node) {
      try {
        var hamster = new Worker('src/common/wheel.min.js');
        hamster.terminate();
      } catch(e) {
        hamsters.wheel.env.legacy = true;
      }
    }
    if(hamsters.wheel.env.browser) {
      if(isIE(10)) {
        try {
          var hamster = new Worker('src/common/wheel.min.js');
          hamster.terminate();
          hamsters.wheel.env.ie10 = true;
        } catch(e) {
          hamsters.wheel.env.legacy = true;
        }
      }
      if(!Worker || navigator.userAgent.indexOf('Kindle/3.0') !== -1 || navigator.userAgent.indexOf('Mobile/8F190') !== -1  || navigator.userAgent.indexOf('IEMobile') !== -1) {
        hamsters.wheel.env.legacy = true;
      } else if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
        if(hamsters.maxThreads > 20) {
          hamsters.maxThreads = 20;
        }
      }
    }
    if(hamsters.wheel.env.worker) {
       try {
        hamsters.wheel.uri = self.URL.createObjectURL(createBlob('(' + String(giveHamsterWork(true)) + '());'));
        var SharedHamster = new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel');
      } catch(e) {
        hamsters.wheel.env.legacy = true;
      }
    }
    if(hamsters.wheel.env.shell) {
      hamsters.wheel.env.legacy = true;
    }
    //Check for transferrable object support
    if(!Uint8Array) {
      hamsters.wheel.env.transferrable = false;
    }
    if(typeof navigator === 'object') {
      hamsters.maxThreads = navigator.hardwareConcurrency;
    }
    callback(hamsters.wheel.env.legacy);
  };

  /**
   * @description: Method for checking wheel error log
   * @method checkErrors
   * @return ObjectExpression
   */
  hamsters.tools.checkErrors = function() {
    return {
      msg: 'There are currently ' + hamsters.wheel.errors.length + ' errors captured in the wheel',
      total: hamsters.wheel.errors.length,
      errors: hamsters.wheel.errors
    };
  };
  
  /**
   * @description: Splits an array into equal sized subarrays for individual workers
   * @constructor
   * @method splitArray
   * @param {array} array - incoming array to be split
   * @param {integer} n - total subarrays  
   * @return ArrayExpression
   */
  hamsters.tools.splitArray = function(array, n) {
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

  /**
   * @description: Abstracts for loop usage
   * @constructor
   * @method for
   * @param {object} input - input params
   * @param {function} callback - callback when output ready
   * @return 
   */
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
      if(typeof self.params.run === 'string') {
        if(!self.params.worker) {
          self.operator = new Function(self.params.run);
        } else {
          self.operator = eval("(" + self.params.run + ")");
        }
      } else {
        self.operator = self.params.run;
      }
      if(self.params.limit === 'compute') {
        self.params.limit = self.params.array.length;
      }
      var i = 0;
      for (i = self.params.init; i < self.params.limit; i += self.params.incrementBy) {
        rtn.data.push(self.operator(self.params.array[i]));
      }
    }, function(output) {
      callback(output);
    }, threads, true, input.dataType);
  };

  /**
   * @description: Parses a json string in a background thread
   * @constructor
   * @method parseJson
   * @param {string} string - json string object
   * @param {function} callback - callback when output ready
   * @return 
   */
  hamsters.tools.parseJson = function(string, callback) {
    hamsters.run({input: string}, function() {
      rtn.data.push(JSON.parse(params.input));
    }, function(output) {
      callback(output[0]);
    }, 1, true);
  };

  /**
   * @description: Stringifies a json object in a background thread
   * @constructor
   * @method parseJson
   * @param {object} json - json object
   * @param {function} callback - callback when output ready
   * @return 
   */
  hamsters.tools.stringifyJson = function(json, callback) {
    hamsters.run({input: json}, function() {
      rtn.data.push(JSON.stringify(params.input));
    }, function(output) {
      callback(output[0]);
    }, 1, true);
  };

  /**
   * @description: Generates a worker which generates an array of random numbers for testing
   * @constructor
   * @function randomArray
   * @method randomArray
   * @param {integer} count - array size
   * @param {function} callback - callback when array ready
   * @return 
   */
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
      var total = params.count;
      var i = 0;
      while(i < total) {
        rtn.data[rtn.data.length] = Math.round(Math.random() * (100 - 1) + 1);
        i += 1;
      }
    }, function(output) {
        callback(output);
    }, 1, false, null, false);
  };

  /**
 * Description
 * @method compareArrays
 * @param {array} array1
 * @param {array} array2
 * @return CallExpression
 */
  hamsters.wheel.compareArrays = function (array1, array2) {
      if(!array1 && !array2) {
        return true;
      }
      if (array1.length !== array2.length) {
          return false;
      }
      return array1.every(function (el, i) {
          return (el === array2[i]);
      });
  };

  /**
   * Description
   * @method checkCache
   * @param {string} fn
   * @param {array} input
   * @param {string} dataType
   * @return 
  */
  hamsters.wheel.checkCache = function(fn, input, dataType) {
    var item;
    for (var i = 0, len = sessionStorage.length; i < len; i++) {
      item = eval('('+sessionStorage[i]+')');
      var equals = hamsters.wheel.compareArrays(item.input, input);
      if(item && item.func === fn && equals  && !item.dataType && !dataType) {
        return item.output;
      } else if(item && item.func === fn && equals && item.dataType === dataType) {
        return hamsters.wheel.processDataType(item.dataType, item.output);
      }
    }
  };

  hamsters.wheel.memoize = function(fn, inputArray, output, dataType) {
    if(hamsters.wheel.checkCache(fn, inputArray, dataType)) {
      return;
    }
    try {
      sessionStorage.setItem(sessionStorage.length, JSON.stringify({'func': fn, 'input': inputArray, 'output': output, 'dataType': dataType}));
    } catch(eve) {
      if(eve.name === 'QuotaExceededError') {
        sessionStorage.clear();
        try {
          sessionStorage.setItem(sessionStorage.length, JSON.stringify({'func': fn, 'input': inputArray, 'output': output, 'dataType': dataType}));
        } catch(e) { //Do nothing, can't cache this result..too large
          return;
        }
      }
    }
  };

  /**
    * @description: Setups library objects for web worker use with library boilerplate
    * @constructor
    * @function spawnHamsters
    * @method spawnHamsters
    * @return 
  */
  var spawnHamsters = function() {
    if(hamsters.wheel.env.browser) {
      hamsters.wheel.uri = self.URL.createObjectURL(createBlob('(' + String(giveHamsterWork(false)) + '());'));
    }
    if(hamsters.persistence) {
      var i = hamsters.maxThreads;
      for (i; i > 0; i--) {
        if(hamsters.wheel.env.node || hamsters.wheel.env.ie10) {
          hamsters.wheel.hamsters.push(new Worker('src/common/wheel.min.js'));
        } else if(hamsters.wheel.env.worker) {
          hamsters.wheel.hamsters.push(new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel'));
        } else {
          hamsters.wheel.hamsters.push(new Worker(hamsters.wheel.uri));
        }
      }
    }
  };
  
  /**
    * @description: Creates boiler plate logic for worker thread
    * @constructor
    * @method giveHamsterWork
    * @return work
  */
  var giveHamsterWork = function(worker) {
    /**
     * Description
     * @method processDataType
     * @param {string} dataType
     * @param {array} buffer
     * @return arr
     */
    /**
     * Description
     * @method onmessage
     * @param {object} e
     * @return 
     */
    if(worker) {
      return function() {
        self.processDataType = function(dataType, buffer) {
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
                  self.rtn.data = self.processDataType(self.params.dataType, self.rtn.data);
                  self.rtn.dataType = self.params.dataType;
                }
                port.postMessage({
                  results: self.rtn
                });
            }, false);
        }, false);
      };
    }
    /**
     * Description
     * @method onmessage
     * @param {object} e
     * @return 
     */
    return function() {
      self.processDataType = function(dataType, buffer) {
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
        self.rtn = {
          success: true, 
          data: []
        };
        self.params = e.data;
        self.fn = new Function(self.params.fn);
        if(self.fn) {
          self.fn();
        }
        if(self.params.dataType && self.params.dataType != "na") {
          self.rtn.data = self.processDataType(self.params.dataType, self.rtn.data);
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
    };
  };

  /**
    * @description: Sorts an array of objects based on incoming property param
    * @constructor
    * @method sort
    * @param {string} property - property to sort by
    * @return FunctionExpression
  */
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

  /**
    * @description: Takes an incoming sequential function and automatically splits the work across as many defined threads for paralell execution
    * @constructor
    * @method run
    * @param {object} params - Incoming params object for task
    * @param {function} fn - Sequential function to execute
    * @param {function} callback - Task callback when all threads complete
    * @param {integer} workers - Total number of threads to use
    * @param {boolean} aggregate - Aggregate individual thread outputs into final array (yes/no)
    * @param {string} dataType - Optional typedArray data type for transferrable object support
    * @param {boolean} memoize - Memoize final result (yes/no)
    * @param {string} order - Optional sort direction param 
    * @return 
  */
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
    } else {
      hamsters.wheel.work(task, params, fn, callback, aggregate, dataType, memoize, order);
    }
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

  /**
    * @description: Registers new task for runtime
    * @constructor
    * @method newTask
    * @param {integer} taskid - ID to use for task generation
    * @param {integer} workers - Number of threads to spawn for this task
    * @param {string}  order - Optional sorting order param
    * @param {string}  dataType - Optional dataType param
    * @param {function} fn - Function to run for this task
    * @param {function} cb - Task callback for output result
    * @return 
  */
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

  /**
    * @description: Tracks thread input for memoization
    * @constructor
    * @method trackInput
    * @param {array} inputArray - Incoming array param
    * @param {string} threadid - Current worker threadid
    * @param {object} task - Current task to track
    * @param {object} hamsterfood - Incoming task params
    * @return 
  */
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

  /**
    * @description: Adds thread to thread pool for execution when a free thread is available
    * @constructor
    * @method poolThread
    * @param {array} inputArray - Input array
    * @param {object} hamsterfood - Input params object
    * @param {string} threadid - task scoped worker thread id
    * @param {function} callback - Callback function to return response
    * @param {function} task - Work to be executed inside thread
    * @param {boolean} agg - Aggregate final result (yes/no)
    * @param {boolean} memoize - Memoize final result (yes/no)
    * @return 
  */
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

  /**
    * @description: Simulates threading for execution on devices that don't support workers
    * @constructor
    * @method legacyProcessor
    * @param {object} food - Input params object
    * @param {array} inputArray - Input array
    * @param {function} callback - Callback function to return response
    * @return 
  */
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

  /**
    * @description: Creates dataBlob for worker generation
    * @constructor
    * @method createBlob
    * @param {string} textContent - Web worker boiler plate
    * @return blob
  */
  var createBlob = function(textContent) {
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
  };

  /**
    * @description: Aggregates individual hamster outputs into a single array
    * @constructor
    * @method aggregate
    * @param {array} input - incoming array of subarrays
    * @param {string} dataType
    * @return output
  */
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

  /**
    * @description: Get our nested output values from each task, return array of subarrays
    * @constructor
    * @method getOutput
    * @param {array} output - incoming task output
    * @param {boolean} aggregate
    * @param {string} dataType
    * @return rtn
  */
  hamsters.wheel.getOutput = function(output, aggregate, dataType) {
    if(aggregate && output.length <= 20) {
      return hamsters.tools.aggregate(output, dataType);
    }
    return output;
  };

  /**
    * @description: Process next item in queue
    * @constructor
    * @method processQueue
    * @param {object} hamster - Most recently finished web worker, for reuse
    * @param {blob} dataBlob
    * @return 
  */
  hamsters.wheel.processQueue = function(hamster, item) {
    if(!item) {
      return;
    }
    hamsters.wheel.newWheel(item.input, item.params, item.aggregate, item.callback, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
  };

  /**
    * @description: Cleans up last running thread
    * @constructor
    * @method clean
    * @param {object} task - Task associated with id
    * @param {string} id - Most recently finished thread id
    * @return 
  */
  hamsters.wheel.clean = function(task, id) {
    hamsters.wheel.queue.running.splice(hamsters.wheel.queue.running.indexOf(id), 1); //Remove thread from running pool
    task.workers.splice(task.workers.indexOf(id), 1); //Remove thread from task running pool
  };

  /**
    * @description: Handle response from worker thread, setup error handling
    * @constructor
    * @method trainHamster
    * @param {integer} id - global wheel threadid
    * @param {boolean} aggregate - boolean aggregate individual thread outputs into final array  
    * @param {function} callback - task callback when all hamsters complete
    * @param {integer} taskid - global wheel task id
    * @param {integer} workerid - worker wheel threadid
    * @param {object} hamster - web worker
    * @param {blob} dataBlob
    * @return 
  */
  hamsters.wheel.trainHamster = function(id, aggregate, callback, task, hamster, memoize) {
    /**
      * @description: Runs when a hamster (thread) finishes it's work
      * @constructor
      * @method onmessage
      * @param {object} e - Web Worker event object
      * @return 
    */
    var onmessage = function(e, results) {
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
          prepareToMemoize(task, aggregate, results);
        }
      }
      if(hamsters.wheel.queue.pending.length !== 0) {
        hamsters.wheel.processQueue(hamster, hamsters.wheel.queue.pending.shift());
      } else if(!hamsters.persistence && !hamsters.wheel.env.worker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    };

    var prepareToMemoize = function(task, aggregate, results) {
      var output = hamsters.wheel.getOutput(task.output, aggregate, results.dataType);
      if(output && !output.slice) {
        hamsters.wheel.memoize(task.fn, task.input[0].input, hamsters.wheel.normalizeArray(output), results.dataType);
      } else {
        hamsters.wheel.memoize(task.fn, task.input[0].input, hamsters.wheel.getOutput(task.output, aggregate, results.dataType), results.dataType);
      }
    };

    /**
      * @description: Setup error handling
      * @constructor
      * @method errorHandler
      * @param {object} e - Web Worker event object
      * @return 
    */
    var onerror = function(e) {
      if(!hamsters.wheel.env.worker) {
        hamster.terminate(); //Kill the thread
      }
      hamsters.wheel.errors.push({
        msg: 'Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message
      });
      console.error('Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message);
    };

    if(hamsters.wheel.env.worker) {
      hamster.port.onmessage = onmessage;
      hamster.port.onerror = onerror;
    } else {
      hamster.onmessage = onmessage;
      hamster.onerror = onerror;
    }   
  };

  /**
    * @description: Normalizes typed array into normal array
    * @constructor
    * @method normalizeArray
    * @param {object} input - typedArray input
    * @return arr
  */
  hamsters.wheel.normalizeArray = function(input) {
    var arr = [];
    var n = 0;
    var len = input.length;
    for (n; n < len; n += 1) {
      arr.push(input[n]);
    }
    return arr;
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

  /**
    * @description: Converts array buffer or normal array into a typed array
    * @constructor
    * @method processDataType
    * @param {string} dataType - dataType config param
    * @param {object} buffer - buffer object or normal array
    * @return arr
  */
  hamsters.wheel.processDataType = function(dataType, buffer) {
    if(hamsters.wheel.env.transferrable) {
      return hamsters.wheel.processData(dataType, buffer);
    }
    return buffer; //Return normal array if transferrable objects not supported
  };

  /**
    * @description: Sends message to worker thread to invoke execution
    * @constructor
    * @method feedHamster
    * @param {object} hamster - web worker
    * @param {object} food - params object for worker
    * @param {array} inputArray
    * @return 
  */
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

  /**
    * @description: Creates new worker thread with body of work to be completed
    * @constructor
    * @method newWheel
    * @param {array} inputArray
    * @param {object} hamsterfood - incoming params object for worker
    * @param {boolean} aggregate - boolean aggregate individual thread outputs into final array  
    * @param {function} callback - task callback when all hamsters complete
    * @param {integer} taskid - global wheel task id
    * @param {integer} threadid - global wheel threadid
    * @param {object} hamster - web worker
    * @param {blob} dataBlob
    * @return 
   */
  setupEnv(function(legacy) {
    if(legacy) {
      hamsters.wheel.newWheel = function(inputArray, hamsterfood, aggregate, callback, task, threadid, hamster, memoize) {
        hamsters.wheel.trackThread(task, hamsters.wheel.queue.running, threadid);
        if(memoize || hamsters.debug) {
          hamsters.wheel.trackInput(inputArray, threadid, task, hamsterfood);
        }
        hamsters.wheel.legacyProcessor(hamsterfood, inputArray, function(output) {
          hamsters.wheel.clean(task, threadid);
          task.output[threadid] = output.data;
          if(task.workers.length === 0 && task.count === task.threads) { //Task complete get output and return
            if(hamsters.debug) {
              console.info('Execution Complete! Elapsed: ' + ((new Date().getTime() - task.input[0].start)/1000) + 's');
            }
            callback(hamsters.wheel.getOutput(task.output, aggregate, output.dataType));
            hamsters.wheel.tasks[task.id] = null; //Clean up our task, not needed any longer
            if(hamsters.cache && memoize !== false) {
              if(output.data.length > 0 && !output.dataType) {
                hamsters.wheel.memoize(task.fn, task.input, output.data, 'na');
              } else if(output.data.length > 0 && output.dataType) {
                hamsters.wheel.memoize(task.fn, task.input, hamsters.wheel.normalizeArray(output.data), output.dataType);
              }
            }
          }
        });
        task.count += 1; //Thread finished
        return;
      };
    } else {
      hamsters.wheel.newWheel = function(inputArray, hamsterfood, aggregate, callback, task, threadid, hamster, memoize) {
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
          } else if(hamsters.wheel.env.node || hamsters.wheel.env.ie10) {
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
      };
      spawnHamsters();
    }
  });
})();

if(typeof module !== 'undefined') {
  module.exports = hamsters;
}