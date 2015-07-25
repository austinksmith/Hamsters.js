//** Start JS Lint Settings **
/*globals self,Worker,Blob,rtn*/
/*jslint vars:true, devel:true, browser:true, evil:true*/
//** End JS Lint Settings **

/*
* Title: WebHamsters
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/
var hamsters = {
  version: '2.9',
  debug: false,
  cache: false,
  maxThreads: Math.ceil((navigator.hardwareConcurrency || 1) * 1.25),
  tools: {},
  wheel: {
    legacy: false,
    queue: {
      running: [],
      pending: []
    }, 
    tasks: [],
    errors: [],
    setup: {},
    uri: null
  }
};

/**
 * @description: Initializes and sets up library functionality
 * @method wakeUp
 * @return
 */
self.wakeUp = function() {
  "use strict";

  /**
   * @description: Detect Internet Explorer by Version IE10 and below
   * @method isIE
   * @param {integer} version
   * @return CallExpression
   */
  self.isIE = function(version) {
    return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
  };

  /**
   * Description
   * @description: Detect browser support for web workers
   * @method isLegacy
   * @return
   */
  self.isLegacy = function(callback) {
    try { //Try catch needed for asm.js fallback
      if(!window.Worker || navigator.userAgent.indexOf('Kindle/3.0') !== -1 || navigator.userAgent.indexOf('Mobile/8F190') !== -1  || navigator.userAgent.indexOf('IEMobile') !== -1  || self.isIE(10)) {
        hamsters.wheel.legacy = true;
      }
    } catch(e) {
      hamsters.wheel.legacy = true;
    }
    callback(hamsters.wheel.legacy);
  };

  /**
   * @description: Method for checking wheel error log
   * @method checkErrors
   * @return ObjectExpression
   */
  hamsters.checkErrors = function() {
    var errors = hamsters.wheel.errors || [];
    return {
      'msg': 'There are currently ' + errors.length + ' errors captured in the wheel',
      'total': errors.length,
      'errors': errors
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
    if(array.length && !array.slice) {
      array = hamsters.wheel.normalizeArray(array);
    }
    var tasks = [];
    var i = 0;
    if(array) {
      var len = array.length;
      var size = Math.ceil(len/n);
      while (i < len) {
        tasks.push(array.slice(i, i += size));
      }
      return tasks;
    }
    return [];
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
        'msg': 'Unable to generate random array, missing required params'
      });
      return;
    }
    var params = {
      'count': count
    };
    hamsters.run(params, function() {
      var total = params.count;
      var i = 0;
      while(i < total) {
        rtn.data[rtn.data.length] = Math.round(Math.random() * (100 - 1) + 1);
        i+=1;
      }
    }, function(output) {
        callback(output);
    }, 1, false, 'Int32', false);
  };

   /**
   * Description
   * @method checkCache
   * @param {string} fn
   * @param {array} input
   * @param {string} dataType
   * @return 
   */
  hamsters.wheel.checkCache = function(hash, dataType) {
    var item;
    var i = 0;
    var len = sessionStorage.length;
    for (i; i < len; i+=1) {
      item = JSON.parse(sessionStorage[i]);
      if(item && item['#'] === hash && item.dT === dataType) {
        var rtn = item.oP;
        if(dataType && !hamsters.wheel.legacy) {
          rtn = hamsters.wheel.processDataType(dataType, item.oP);
        }
        return rtn;
      }
    }
  };

  /**
   * Description
   * @method memoize
   * @param {string} fn
   * @param {array} input
   * @param {array} output
   * @param {string} dataType
   * @return 
   */
  hamsters.wheel.memoize = function(fn, input, output, dataType) {
    var hash = hamsters.wheel.hashResult({'func': fn, 'dT': dataType, 'input': input});
    if(hamsters.wheel.checkCache(hash, dataType)) {
      return;
    }
    try {
      sessionStorage.setItem(sessionStorage.length, JSON.stringify({'#': hash,  'dT': dataType, 'oP': output}));
    } catch(eve) {
      if(eve.name === 'QuotaExceededError') {
        sessionStorage.clear();
        try {
          sessionStorage.setItem(sessionStorage.length, JSON.stringify({'#': hash,  'dT': dataType, 'oP': output}));
        } catch(e) { //Do nothing, can't cache this result..too large
          return;
        }
      }
    }
  };

  /**
   * Description
   * @method compareArrays
   * @param {array} array1
   * @param {array} array2
   * @return CallExpression
   */
  hamsters.wheel.compareArrays = function (array1, array2) {
      if (array1.length !== array2.length) {
          return false;
      }
      return array1.every(function (el, i) {
          return (el === array2[i]);
      });
  };

  /**
   * @description: Setups dom objects for web worker use with library boilerplate
   * @constructor
   * @function populateElements
   * @method populateElements
   * @return 
   */
  self.populateElements = function() {
    hamsters.wheel.setup.getOrCreateElement(0);
  };
  
  /**
   * @description: Setups dom objects for web worker use with library boilerplate
   * @constructor
   * @method getOrCreateElement
   * @param {integer} id - thread # to populate 
   * @return script
   */
  hamsters.wheel.setup.getOrCreateElement = function(id) {
    var script = (document.getElementById('hamster'+id) || null);
    if(!script) {
      var work = hamsters.wheel.giveHamsterWork();
      script = document.createElement('script');
      script.type = ('javascript/worker');
      script.id = ('hamster'+id);
      script.text = '(' + String(work) + '());';
      document.getElementsByTagName('head')[0].appendChild(script);
      return script;
    }
    return script;
  };
  
  /**
   * @description: Creates boiler plate logic for worker thread
   * @constructor
   * @method giveHamsterWork
   * @return work
   */
  hamsters.wheel.giveHamsterWork = function() {
    var work = function() {
      var params, output;
      /**
       * Description
       * @method respond
       * @param {object} rtn
       * @param {string} msg
       * @return 
       */
      var respond = function(rtn, msg) {
        if(params.dataType !== "na") {
          output = processDataType(params.dataType, rtn.data);
          rtn.data = output.buffer;
          rtn.dataType = params.dataType;
          self.postMessage({
            'results': rtn || null,
            'msg': msg || ''
          }, [output.buffer]);
        } else {
          self.postMessage({
            'results': rtn || null,
            'msg': msg || ''
          });
        }
      };
      /**
       * Description
       * @method processDataType
       * @param {string} dataType
       * @param {array} buffer
       * @return arr
       */
      var processDataType = function(dataType, buffer) {
        if (dataType === 'uint32') {
          return new Uint32Array(buffer);
        }
        if (dataType === 'uint16') {
          return new Uint16Array(buffer);
        }
        if (dataType === 'uint8') {
          return new Uint8Array(buffer);
        }
        if (dataType === 'uint8clamped') {
          return new Uint8ClampedArray(buffer);
        }
        if (dataType === 'int32') {
          return new Int32Array(buffer);
        }
        if (dataType === 'int16') {
          return new Int16Array(buffer);
        }
        if (dataType === 'int8') {
          return new Int8Array(buffer);
        }
        if (dataType === 'float32') {
          return new Float32Array(buffer);
        }
        if (dataType === 'float64') {
          return new Float64Array(buffer);
        }
        return buffer;
      };

      /**
       * Description
       * @method onmessage
       * @param {object} e
       * @return 
       */
      self.onmessage = function(e) {
        var rtn = {
          'success': true, 
          'data': []
        };
        params = e.data;
        if(typeof params === 'string') {
          params = JSON.parse(e.data);
        }
        if(params.dataType !== "na" && typeof params.array === 'object') {
          params.array = processDataType(params.dataType, params.array);
        }
        var fn = eval('('+params.fn+')');
        if(fn) {
          fn();
          respond(rtn);
        } else {
          rtn.success = false;
          rtn.error = 'Missing function';
          rtn.msg = 'Error encounted check errors for details';
          respond(rtn);
        }
      };
    };
    return work;
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
   * @param {object} params - incoming params object for task
   * @param {function} fn - Sequential function to execute
   * @param {function} callback - task callback when all threads complete
   * @param {integer} workers - total number of threads to use
   * @param {boolean} aggregate - boolean aggregate individual thread outputs into final array  
   * @param {string} dataType
   * @return 
   */
  hamsters.run = function(params, fn, callback, workers, aggregate, dataType, memoize, order) {
    if(!params || !fn) {
      return 'Error processing for loop, missing params or function';
    }
    var taskid = hamsters.wheel.tasks.length;
    workers = workers || hamsters.maxThreads;
    hamsters.wheel.newTask(taskid, workers, order, dataType, fn, callback);
    var task = hamsters.wheel.tasks[taskid];
    callback = (callback || null);
    var hamsterfood = {'array':[]};
    hamsterfood.fn = fn.toString();
    if(dataType) {
      dataType = dataType.toLowerCase();
    } else {
      dataType = "na";
    }
    if(hamsters.cache && params.array && params.array.length !== 0) {
      memoize = memoize || true;
      var hash = hamsters.wheel.hashResult({'func': fn, 'dT': "na", 'input': params.array});
      var result = hamsters.wheel.checkCache(hash, dataType);
      if(result && callback) {
        setTimeout(function() {
          callback(result);
          hamsters.wheel.tasks[taskid] = null; //Clean up our task, not needed any longer
        }, 4);
        return;
      }
    }
    var key;
    for(key in params) {
      if(params.hasOwnProperty(key)) {
        if(key !== 'array') {
          hamsterfood[key] = params[key];
        }
      }
    }
    hamsterfood.dataType = dataType || null;
    var workArray = params.array || null;
    if(params.array && task.threads !== 1) {
      workArray = hamsters.tools.splitArray(params.array, task.threads); //Divide our array into equal array sizes
    }
    var i = 0;
    while(i < task.threads) {
      if(workArray && task.threads !== 1) {
        hamsters.wheel.newWheel(workArray[i], hamsterfood, aggregate, callback, taskid, i, null, memoize);
      } else {
        hamsters.wheel.newWheel(workArray, hamsterfood, aggregate, callback, taskid, i, null, memoize);
      }
      i+=1;
    }
  };

  hamsters.wheel.newTask = function(taskid, workers, order, dataType, fn, callback) {
    hamsters.wheel.tasks.push({
      'id': taskid,
      'workers': [],
      'count': 0,
      'threads': workers, 
      'input': [],
      'dataType': dataType || null,
      'fn': fn || null,
      'output': [], 
      'order': order || null,
      'callback': callback
    });
  };

  hamsters.wheel.trackInput = function(task, inputArray, thread, taskid, hamsterfood) {
    task.input.push({ 
      'input': inputArray,
      'workerid': thread, 
      'taskid': taskid, 
      'params': hamsterfood, 
      'start': new Date().getTime()
    });
  };

  hamsters.wheel.poolThread = function(queue, inputArray, hamsterfood, threadid, callback, taskid, aggregate, memoize) {
    queue.pending.push({
      'memoize': memoize,
      'input': inputArray,
      'params': hamsterfood,
      'workerid': threadid, 
      'callback': callback, 
      'taskid': taskid, 
      'aggregate': aggregate
    });
  };

  hamsters.wheel.trackThread = function(task, queue, thread) {
    task.workers[task.workers.length] = thread; //Keep track of threads scoped to current task
    queue.running[queue.running.length] = thread; //Keep track of all currently running threads
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
  hamsters.wheel.legacyProcessor = function(food, inputArray, callback) {
    setTimeout(function() {
      var params = food;
      var rtn = {
        'success': true, 
        'data': []
      };
      var respond = function(rtn) {
        callback(rtn); // Return legacy output
      };
      params.array = inputArray;
      var fn = eval('('+params.fn+')');
      if(fn) {
        fn();
        respond(rtn);
      } else {
        rtn.success = false;
        rtn.error = 'Missing function';
        rtn.msg = 'Error encounted check errors for details';
        respond(rtn);
      }
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  };

  /**
   * @description: Creates web worker thread
   * @constructor
   * @method createHamster
   * @param {integer} thread - Thread #
   * @return ObjectExpression
   */
  hamsters.wheel.createHamster = function() {
    if(!hamsters.wheel.uri) {
      var hamster = hamsters.wheel.setup.getOrCreateElement(0);
      var blob = hamsters.wheel.createBlob(hamster.textContent);
      hamsters.wheel.uri = window.URL.createObjectURL(blob);
      setTimeout(function() {
        hamsters.wheel.terminateHamster(blob);
      }, 4);
    }
    var worker = new Worker(hamsters.wheel.uri);
    return worker;
  };

  /**
   * @description: Creates dataBlob for worker generation
   * @constructor
   * @method createBlob
   * @param {string} textContent - Web worker boiler plate
   * @return blob
   */
  hamsters.wheel.createBlob = function(textContent) {
    if(Blob) {
      return new Blob([textContent], {type: 'application/javascript'});
    }
    var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
    if(BlobBuilder) { //Fallback for browsers that don't support blob constructor
      var blob = new BlobBuilder();
      blob.append([textContent], {type: 'application/javascript'});
      blob = blob.getBlob();
      return blob;
    }
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
    if(!input) {
      console.error("Missing array");
      return;
    }
    if(input.length > 20) {
      return input;
    }
    if(dataType) {
      return hamsters.wheel.aggregateTypedArrays(input, dataType);
    }
    return input.reduce(function(a, b) {
      return a.concat(b);
    });
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
    if(aggregate) {
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
  hamsters.wheel.processQueue = function(hamster) {
    var item = hamsters.wheel.queue.pending.shift(); //Get and remove first item from queue
    if(item) {
      hamsters.wheel.newWheel(item.input, item.params, item.aggregate, item.callback, item.taskid, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
    }
  };

  /**
   * @description: Cleans up memory used by dataBlob 
   * @constructor
   * @method terminateHamster
   * @param {object} dataBlob - dataBlob to free from memory, critical for IE11 support
   * @return 
   */
  hamsters.wheel.terminateHamster = function(dataBlob) {
    if(!dataBlob) {
      return;
    }
    if(dataBlob.close) {
      dataBlob.close();
      return;
    }
    if(dataBlob.msClose) {
      dataBlob.msClose();
      return;
    }
    if(dataBlob.slice) {
      dataBlob = dataBlob.slice(0,0);
    }
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
  hamsters.wheel.trainHamster = function(id, aggregate, callback, taskid, workerid, hamster, memoize) {

    /**
     * @description: Runs when a hamster (thread) finishes it's work
     * @constructor
     * @method onmessage
     * @param {object} e - Web Worker event object
     * @return 
     */
    hamster.onmessage = function(e) {
      var queue = hamsters.wheel.queue;
      if(queue.pending.length === 0) {
        setTimeout(function() {
          hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
        }, 4);
      }
      queue.running.splice(queue.running.indexOf(id), 1); //Remove thread from running pool
      var task = hamsters.wheel.tasks[taskid];
      if(!task) {
        hamsters.wheel.errors = hamsters.wheel.errors.concat({
          'timeStamp': e.timeStamp, 
          'msg': 'Error, unable to match thread to task, throwing exception', 
          'taskid': taskid, 
          'workerid': workerid, 
          'aggregate': aggregate, 
          'callback': callback
        });
        console.error('Fatal Exception, unable to match thread #'+workerid+' to task #'+ taskid + ', cannot continue. Check errors for more details');
        return;
      }
      task.workers.splice(task.workers.indexOf(workerid), 1); //Remove thread from task running pool
      var results = e.data.results;
      if(results.dataType && typeof results.data === 'object') {
        results.data = hamsters.wheel.processDataType(results.dataType, results.data);
      }
      task.output[workerid] = results.data;
      if(task.workers.length === 0 && task.count === task.threads) {
        var output = hamsters.wheel.getOutput(task.output, aggregate, results.dataType);
        if(hamsters.debug) {
          console.info('Execution Complete! Elapsed: ' + ((e.timeStamp - task.input[0].start)/1000) + 's');
        }
        if(task.order) {
          callback(hamsters.wheel.sort(output, task.order));
        } else {
          callback(output);
        }
        hamsters.wheel.tasks[taskid] = null; //Clean up our task, not needed any longer
        if(hamsters.cache && memoize !== false) {
          var inputArray = task.input[0].input;
          if(output.length > 0 && !results.dataType) {
            setTimeout(function() {
              hamsters.wheel.memoize(task.fn, inputArray, output, 'na');
            }, 4);
          } else if(output.length > 0 && results.dataType) {
            setTimeout(function() {
              hamsters.wheel.memoize(task.fn, inputArray, hamsters.wheel.normalizeArray(output), results.dataType);
            }, 4);
          }
        }
      } else if(hamsters.debug === 'verbose') {
        console.info('Hamster #' + id + ' finished ' + '@ ' + e.timeStamp);
      }
      if(queue.pending.length !== 0) {
        hamsters.wheel.processQueue(hamster);
      }
    };

    /**
     * @description: Setup error handling
     * @constructor
     * @method onerror
     * @param {object} e - Web Worker event object
     * @return 
     */
    hamster.onerror = function(e) {
      hamster.terminate(); //Kill the thread
      var msg = 'Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message;
      hamsters.wheel.errors = hamsters.wheel.errors.concat({
        'msg': msg
      });
      console.error(msg);
    };
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
    for (n; n < len; n++) {
      arr.push(input[n]);
    }
    return arr;
  };

  /**
   * Description
   * @method aggregateTypedArrays
   * @param {array} input
   * @param {string} dataType
   * @return output
   */
  hamsters.wheel.aggregateTypedArrays = function(input, dataType) {
    var output;
    var i = 0;
    var len = input.length;
    var bufferLength = 0;
    for (i; i < len; i+=1) {
      bufferLength += input[i].length;
    }
    output = hamsters.wheel.processDataType(dataType, bufferLength);
    var n = 0;
    var offset = 0;
    for (n; n < len; n+=1) {
      output.set(input[n], offset);
      offset += input[n].length;
    }
    return output;
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
    if (dataType === 'uint32') {
      return new Uint32Array(buffer);
    }
    if (dataType === 'uint16') {
      return new Uint16Array(buffer);
    }
    if (dataType === 'uint8') {
      return new Uint8Array(buffer);
    }
    if (dataType === 'uint8clamped') {
      return new Uint8ClampedArray(buffer);
    }
    if (dataType === 'int32') {
      return new Int32Array(buffer);
    }
    if (dataType === 'int16') {
      return new Int16Array(buffer);
    }
    if (dataType === 'int8') {
      return new Int8Array(buffer);
    }
    if (dataType === 'float32') {
      return new Float32Array(buffer);
    }
    if (dataType === 'float64') {
      return new Float64Array(buffer);
    }
    return buffer;
  };

  hamsters.wheel.generateHash = function(string) {
    string = String(string);
    var hash = 0;
    var i;
    for (i = string.length - 1; i >= 0; i--) { //Shift 5 bits
      hash += (((hash << 5) - hash) + string.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return hash;
  };

  hamsters.wheel.hashResult = function(obj) {
    var result = 0;
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) {
          if(typeof obj[key] === 'object' && obj[key].length && !obj[key].slice) {
            result += hamsters.wheel.generateHash(key + String(hamsters.wheel.normalizeArray(obj[key])));
          } else {
            result += hamsters.wheel.generateHash(key + obj[key]);
          }
        }
    }
    return result;
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
    if(inputArray && food.dataType) { //Transferable object transfer if using typed array
      food.array = hamsters.wheel.processDataType(food.dataType, inputArray);
    } else if(inputArray) {
      food.array = inputArray;
    }
    if(food.array && food.array.buffer) {
      var buffer = food.array.buffer;
      food.array = buffer;
      hamster.postMessage(food,  [buffer]);
    } else {
      hamster.postMessage(food);
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
  self.isLegacy(function(legacy) {
    if(legacy) {
      hamsters.wheel.newWheel = function(inputArray, hamsterfood, aggregate, callback, taskid, threadid, hamster, memoize) {
        var task = hamsters.wheel.tasks[taskid];
        if(!task) {
          hamsters.wheel.errors.push({
            'msg': 'Error, unable to match thread to task, throwing exception', 
            'params': hamsterfood, 
            'aggregate': aggregate, 
            'callback': callback
          });
          console.error('Error, unable to match thread to task ' + taskid + ', throwing exception. Check errors for more details');
          return;
        }
        var debug = hamsters.debug;
        hamsters.wheel.legacyProcessor(hamsterfood, inputArray, function(output) {
          task.count++; //Thread finished
          task.output[threadid] = output.data;
          if(task.count === task.threads) { //Task complete get output and return
            var rtn = hamsters.wheel.getOutput(task.output, aggregate, output.dataType);
            if(debug) {
              console.info('Execution Complete! Elapsed: ' + ((new Date().getTime() - task.input[0].start)/1000) + 's');
            }
            callback(rtn);
            hamsters.wheel.tasks[taskid] = null; //Clean up our task, not needed any longer
            if(hamsters.cache && memoize !== false) {
              if(output.data.length > 0 && !output.dataType) {
                setTimeout(function() {
                  hamsters.wheel.memoize(task.fn, task.input, output.data, 'na');
                }, 4);
              } else if(output.data.length > 0 && output.dataType) {
                setTimeout(function() {
                  hamsters.wheel.memoize(task.fn, task.input, hamsters.wheel.normalizeArray(output.data), output.dataType);
                }, 4);
              }
            }
          }
        });
        return;
      };
    } else {
      hamsters.wheel.newWheel = function(inputArray, hamsterfood, aggregate, callback, taskid, threadid, hamster, memoize) {
        var task = hamsters.wheel.tasks[taskid];
        if(!task) {
          hamsters.wheel.errors.push({
            'msg': 'Error, unable to match thread to task, throwing exception', 
            'params': hamsterfood, 
            'aggregate': aggregate, 
            'callback': callback
          });
          console.error('Error, unable to match thread to task ' + taskid + ', throwing exception. Check errors for more details');
          return;
        }
        var queue = hamsters.wheel.queue;
        if(hamsters.maxThreads && hamsters.maxThreads <= queue.running.length) {
          hamsters.wheel.poolThread(queue, inputArray, hamsterfood, threadid, callback, taskid, aggregate, memoize);
          return;
        }
        var thread = (threadid || task.count); //Determine threadid depending on currently running threads
        var debug = hamsters.debug;
        if(debug || memoize) {
          hamsters.wheel.trackInput(task, inputArray, thread, taskid, hamsterfood);
          if(debug === 'verbose') {
            console.info('Spawning Hamster #' + thread + ' @ ' + new Date().getTime());
          }
        }
        hamsters.wheel.trackThread(task, queue, thread);
        if(!hamster) {
          hamster = hamsters.wheel.createHamster();
        }
        hamsters.wheel.trainHamster(thread, aggregate, callback, taskid, thread, hamster, memoize);
        hamsters.wheel.feedHamster(hamster, hamsterfood, inputArray);
        task.count++; //Increment count, thread is running
      };
      self.populateElements();
    }
  });
};
//Wake 'em up
self.wakeUp();