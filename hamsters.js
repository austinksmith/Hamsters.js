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
//** Start Setup **
var hamsters = {
  version: '2.0',
  debug: false,
  maxThreads: Math.ceil((navigator.hardwareConcurrency || 1) * 1.25),
  tools: {},
  runtime: {
    legacy: false,
    queue: {
      running: [],
      pending: []
    }, 
    tasks: [],
    errors: [],
    setup: {}
  }
};
/**
* @function wakeUp
* @description: Initializes and sets up library functionality
*/
hamsters.runtime.wakeUp = function() {
  "use strict";
  /**
  * @function isIE
  * @description: Detect Internet Explorer by Version IE10 and below
  */
  hamsters.tools.isIE = function(version) {
    return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
  };
  /**
  * @function isLegacy
  * @description: Detect browser support for web workers
  */
  // Internet Explorer 10, Kindle 3, Ipad 1, Internet Explorer Mobile.. don't support web workers properly, legacy flag
  // Kindle/3.0' - Monochrome Kindle 3
  // Mobile/8F190 - Ipad 1
  // IEMobile - Windows Phone 7 - 8.1
  hamsters.runtime.setup.isLegacy = function() {
    if(!window.Worker || navigator.userAgent.indexOf('Kindle/3.0') !== -1 || navigator.userAgent.indexOf('Mobile/8F190') !== -1  || navigator.userAgent.indexOf('IEMobile') !== -1  || hamsters.tools.isIE(10)) {
      hamsters.runtime.legacy = true;
    } else if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
      window.firefox = window.firefox || true;
    }
  };
  /**
  * @function isLegacy
  * @description: Return browser support for library
  */
  hamsters.isLegacy = function() {
    return hamsters.runtime.legacy;
  };
  /**
  * @function checkErrors 
  * @description: Method for checking runtime error log
  */
  hamsters.checkErrors = function() {
    var errors = hamsters.runtime.errors || [];
    return {
      'msg': 'There are currently ' + errors.length + ' errors captured in the runtime',
      'total': errors.length,
      'errors': errors
    };
  };
  /**
  * @function splitArray
  * @description: Splits an array into equal sized subarrays for individual workers
  * @constructor
  * @param {array} array - incoming array to be split
  * @param {integer} n - total subarrays  
  */
  hamsters.tools.splitArray = function(array, n) {
    if(array.length && !array.slice) {
      array = hamsters.runtime.convertArray(array);
    }
    var tasks = [];
    var i = 0;
    if(array) {
      var len = array.length;
      var size = Math.ceil((len/n));
      while (i < len) {
        tasks.push(array.slice(i, i += size));
      }
      return tasks;
    }
    return [];
  };
  /**
  * @function randomArray
  * @description: Generates a worker which generates an array of random numbers for testing
  * @constructor
  * @param {integer} count - array size
  * @param {function} callback - callback when array ready
  */
  hamsters.tools.randomArray = function(count, callback) {
    if(!count || !callback) {
      hamsters.runtime.errors = hamsters.runtime.errors.concat({
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
        i++;
      }
    }, function(output) {
      if(callback) {
        callback(output);
      }
    }, 1, false, 'Int32');
  };
  /**
  * @function populateElements
  * @description: Setups dom objects for web worker use with library boilerplate
  * @constructor
  * @param {integer} id - thread # to populate 
  * @param {function} callback - optional callback once thread boilerplates setup
  */
  hamsters.runtime.setup.populateElements = function(count, callback) {
    for (var i = 0, len = count; i < len; i++) {
      hamsters.runtime.setup.getOrCreateElement(i);
    }
    if(callback) {
      callback.call();
    }
  };
  /**
  * @function getOrCreateElement
  * @description: Setups dom objects for web worker use with library boilerplate
  * @constructor
  * @param {integer} id - thread # to populate 
  */
  hamsters.runtime.setup.getOrCreateElement = function(id) {
    var script = (document.getElementById('hamster'+id) || null);
    if(!script) {
      var work = hamsters.runtime.giveHamsterWork();
      script = document.createElement('script');
      script.type = ('javascript/worker');
      script.id = ('hamster'+id);
      script.text = '(' + work.toString() + '());';
      document.getElementsByTagName('head')[0].appendChild(script);
      return script;
    }
    return script;
  };
  /**
  * @function giveHamsterWork
  * @description: Creates boiler plate logic for worker thread
  * @constructor
  */
  hamsters.runtime.giveHamsterWork = function() {
    var work = function() {
      var params;
      var respond = function(rtn, msg) {
        if(params.dataType) {
          var output = processDataType(params.dataType, rtn.data);
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
      var processDataType = function(dataType, buffer) {
        if(!dataType) {
          return buffer;
        }
        var arr;
        switch(dataType.toLowerCase()) {
          case 'uint32':
            arr = new Uint32Array(buffer);
          break;
          case 'uint16':
            arr = new Uint16Array(buffer);
          break;
          case 'uint8':
            arr = new Uint8Array(buffer);
          break;
          case 'uint8clamped':
            arr = new Uint8ClampedArray(buffer);
          break;
          case 'int32':
            arr = new Int32Array(buffer);
          break;
          case 'int16':
            arr = new Int16Array(buffer);
          break;
          case 'int8':
            arr = new Int8Array(buffer);
          break;
          case 'float32':
            arr = new Float32Array(buffer);
          break; 
          case 'float64':
            arr = new Float64Array(buffer);
          break;
          default:
            arr = buffer;
          break;
        }
        return arr;
      };
      self.onmessage = function(e) {
        var rtn = {
          'success': true, 
          'data': []
        };
        params = e.data;
        if(typeof params === 'string') {
          params = JSON.parse(e.data);
        }
        if(params.dataType && params.array && typeof params.array === 'object') {
          params.array = processDataType(params.dataType, params.array);
        }
        if(params.fn) {
          var fn = eval('('+params.fn+')');
          if(fn && typeof fn === 'function') {
            fn();
            respond(rtn);
          } else {
            rtn.success = false;
            rtn.error = 'Missing function';
            rtn.msg = 'Error encounted check errors for details';
            respond(rtn);
          }
        }
      };
    };
    return work;
  };
  /**
  * @function sort
  * @description: Sorts an array of objects based on incoming property param
  * @constructor
  * @param {string} property - property to sort by
  */
  hamsters.runtime.sort = function(property) {
    if(hamsters.debug === 'verbose') {
      console.info("Sorting array using index: " + property);
    }
    var order = 1;
    if(property[0] === "-") {
      order = -1;
      property = property.substr(1);
    }
    return function (a,b) {
      var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
      return result * order;
    };
  };
  /**
  * @function run
  * @description: Takes an incoming sequential function and automatically splits the work across as many defined threads for paralell execution
  * @constructor
  * @param {object} params - incoming params object for task
  * @param {function} fn - Sequential function to execute
  * @param {function} callback - task callback when all threads complete
  * @param {integer} workers - total number of threads to use
  * @param {boolean} aggregate - boolean aggregate individual thread outputs into final array  
  */
  hamsters.run = function(params, fn, callback, workers, aggregate, dataType) {
    if(!params || !fn) {
      return 'Error processing for loop, missing params or function';
    }
    var taskid = hamsters.runtime.tasks.length;
    workers = workers || hamsters.maxThreads;
    hamsters.runtime.tasks.push({
      'id': taskid,
      'workers': [],
      'count': 0,
      'threads': workers, 
      'input': [], 
      'output': [], 
      'callback': callback
    });
    var task = hamsters.runtime.tasks[taskid];
    callback = (callback || null);
    var hamsterfood = {'array':[]};
    var key;
    for(key in params) {
      if(params.hasOwnProperty(key)) {
        if(key !== 'array') {
          hamsterfood[key] = params[key];
        }
      }
    }
    hamsterfood.fn = fn.toString();
    hamsterfood.dataType = dataType || null;
    var workArray = params.array || null;
    if(params.array && task.threads !== 1) {
      workArray = hamsters.tools.splitArray(params.array, task.threads); //Divide our array into equal array sizes
    }
    var i = 0;
    while(i < task.threads) {
      if(workArray && task.threads !== 1) {
        hamsters.runtime.newWheel(workArray[i], hamsterfood, aggregate, callback, taskid, i);
      } else {
        hamsters.runtime.newWheel(workArray, hamsterfood, aggregate, callback, taskid, i);
      }
      i++;
    }
  };
  /**
  * @function newWheel
  * @description: Creates new worker thread with body of work to be completed
  * @constructor
  * @param {object} hamsterfood - incoming params object for worker
  * @param {boolean} aggregate - boolean aggregate individual thread outputs into final array  
  * @param {function} callback - task callback when all hamsters complete
  * @param {integer} taskid - global runtime task id
  * @param {integer} threadid - global runtime threadid
  * @param {object} hamster - web worker
  */
  hamsters.runtime.newWheel = function(inputArray, hamsterfood, aggregate, callback, taskid, threadid, hamster, dataBlob) {
    var task = hamsters.runtime.tasks[taskid];
    if(!task) {
      hamsters.runtime.errors.push({
        'msg': 'Error, unable to match thread to task, throwing exception', 
        'params': hamsterfood, 
        'aggregate': aggregate, 
        'callback': callback
      });
      console.error('Error, unable to match thread to task ' + taskid + ', throwing exception. Check errors for more details');
      return;
    }
    var queue = hamsters.runtime.queue;
    if(hamsters.maxThreads && hamsters.maxThreads <= queue.running.length) {
      queue.pending.push({
        'input': inputArray,
        'params': hamsterfood,
        'workerid': threadid, 
        'callback': callback, 
        'taskid': taskid, 
        'aggregate': aggregate
      });
      return;
    }
    var thread = (threadid || task.count); //Determine threadid depending on currently running threads
    var debug = hamsters.debug;
    if(debug) {
      task.input.push({ 
        'input': inputArray,
        'workerid': thread, 
        'taskid': taskid, 
        'params': hamsterfood, 
        'start': new Date().getTime()
      });
      if(debug === 'verbose') {
        console.info('Spawning Hamster #' + thread + ' @ ' + new Date().getTime());
      }
    }
    if(hamsters.isLegacy()) { //Legacy fallback for IE10 and older mobile devices.. these don't support web workers properly
      hamsters.runtime.legacyProcessor(hamsterfood, inputArray, function(output) {
        task.count++; //Thread finished
        task.output[threadid] = output.data;
        if(task.count === task.threads) { //Task complete get output and return
            var rtn = hamsters.runtime.getOutput(task.output);
            hamsters.runtime.tasks[taskid] = null; //Clean up our task, not needed any longer
          if(aggregate) {       
            rtn = hamsters.tools.aggregate(rtn, null);
          }
          if(callback) {
            if(debug) {
              console.info('Execution Complete! Elapsed: ' + ((new Date().getTime() - task.input[0].start)/1000) + 's');
            }
            callback(rtn);
          }
        }
      });
      return;
    }
    task.workers[task.workers.length] = thread; //Keep track of threads scoped to current task
    queue.running[queue.running.length] = thread; //Keep track of all currently running threads
    var blobObject = (dataBlob || null);
    var hamsterData;
    if(!hamster) {
      hamsterData = hamsters.runtime.createHamster(thread);
      hamster = hamsterData.worker;
      blobObject = {'blob': hamsterData.dataBlob, 'uri': hamsterData.blobUri};
    }
    hamsters.runtime.trainHamster(thread, aggregate, callback, taskid, thread, hamster, blobObject);
    hamsters.runtime.feedHamster(hamster, hamsterfood, inputArray);
    task.count++; //Increment count, thread is running
  };
  /**
  * @function legacyProcessor
  * @description: Simulates threading for execution on devices that don't support workers
  * @constructor
  * @param {object} food - Input params object
  * @param {array} inputArray - Input array
  * @param {function} callback - Callback function to return response
  */
  hamsters.runtime.legacyProcessor = function(food, inputArray, callback) {
    setTimeout(function() {
      var params = food;
      var rtn = {
      'success': true, 
      'data': []
      };
      if(params.fn) {
        params.array = inputArray;
        var fn = eval('('+params.fn+')');
        if(fn && typeof fn === 'function') {
          try {
            fn();
            if(callback) {
              callback(rtn); // Return legacy output
            }
          } catch(exception) {
            rtn.success = false;
            rtn.error = exception;
            rtn.msg = 'Error encounted check errors for details';
            if(callback) {
              callback(rtn); // Return legacy output
            }
          }
        }
      }
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  };
  /**
  * @function createHamster
  * @description: Creates web worker thread
  * @constructor
  * @param {integer} thread - Thread #
  */
  hamsters.runtime.createHamster = function(thread) {
    var hamster = hamsters.runtime.setup.getOrCreateElement(thread);
    var blob = hamsters.runtime.createBlob(hamster.textContent);
    var uri = window.URL.createObjectURL(blob);
    hamster = new Worker(uri);
    return {'worker': hamster, 'dataBlob': blob, 'blobUri': uri};
  };
  /**
  * @function sendRequest
  * @description: Sends ajax request 
  * @constructor
  * @param {string} type - 'GET' || 'POST'
  * @param {string} url - Url to connect to
  * @param {string} responseType - 'ArrayBuffer','','blob','document','json','text'
  * @param {string} callback - Callback to return response
  */
  hamsters.runtime.sendRequest = function(type, url, responseType, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open(type, url);
    xhr.responseType = responseType;
    xhr.onload = function() {
      callback(this.response);
    };
    xhr.send();
  };
  /**
  * @function fetchArrayBuffer
  * @description: Creates array buffer by issuing a fake ajax request with response of arraybuffer
  * @constructor
  * @param {string} string - input params object
  * @param {function} callback - callback function to return buffer to
  */
  hamsters.runtime.fetchArrayBuffer = function(string, callback) {
    var url = window.URL.createObjectURL(hamsters.runtime.createBlob(string));
    hamsters.runtime.sendRequest('GET', url, 'arraybuffer', function(arrayBuffer) {
      if(callback) {
        callback(arrayBuffer);
      }
    });
  };
  /**
  * @function createBlob
  * @description: Creates dataBlob for worker generation
  * @constructor
  * @param {string} textContent - Web worker boiler plate
  */
  hamsters.runtime.createBlob = function(textContent) {
    var blob;
    try {
      blob = new Blob([textContent], {type: 'application/javascript'});
    } catch(err) {
      var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
      if(BlobBuilder) { //Fallback for browsers that don't support blob constructor
        blob = new BlobBuilder();
        blob.append([textContent], {type: 'application/javascript'});
        blob = blob.getBlob();
      }
    }
    return blob;
  };
  /**
  * @function aggregate
  * @description: Aggregates individual hamster outputs into a single array
  * @constructor
  * @param {array} input - incoming array of subarrays
  * @param {function} taskcallback - task callback when all hamsters complete
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
      var out = [];
      for (var i = 0, len = input.length; i < len; i++) {
        out.push(hamsters.runtime.convertArray(input[i]));
      }
      input = out;
    }
    var output = [];
    output = input.reduce(function(a, b) {
      return a.concat(b);
    });
    return output;
  };
  /**
  * @function getOutput
  * @description: Get our nested output values from each task, return array of subarrays
  * @constructor
  * @param {array} output - incoming task output
  */
  hamsters.runtime.getOutput = function(output, aggregate, dataType) {
    var rtn;
    if(aggregate) {
      rtn = hamsters.tools.aggregate(output, dataType);
    } else {
      rtn = output;
    }
    return rtn;
  };
  /**
  * @function processQueue
  * @description: Process next item in queue
  * @constructor
  * @param {integer} threadid - Most recently finished threadid, for reuse
  * @param {object} hamster - Most recently finished web worker, for reuse
  */
  hamsters.runtime.processQueue = function(hamster, dataBlob) {
    var item = hamsters.runtime.queue.pending.shift(); //Get and remove first item from queue
    if(item) {
      hamsters.runtime.newWheel(item.input, item.params, item.aggregate, item.callback, item.taskid, item.workerid, hamster, dataBlob); //Assign most recently finished thread to queue item
    }
  };
  /**
  * @function terminateHamster
  * @description: Cleans up memory used by dataBlob 
  * @constructor
  * @param {object} dataBlob - dataBlob to free from memory, critical for IE11 support
  */
  hamsters.runtime.terminateHamster = function(dataBlob) {
    if(dataBlob) {
      window.URL.revokeObjectURL(dataBlob.uri);
      if(dataBlob.blob) {
        var close = (dataBlob.blob.close || dataBlob.blob.msClose);
        if(close) {
          close.call();
        } else {
          delete dataBlob.blob;
        }
      }
      dataBlob = null;
    }
  };
  /**
  * @function trainHamster
  * @description: Handle response from worker thread, setup error handling
  * @constructor
  * @param {integer} id - global runtime threadid
  * @param {boolean} aggregate - boolean aggregate individual thread outputs into final array  
  * @param {function} callback - task callback when all hamsters complete
  * @param {integer} taskid - global runtime task id
  * @param {integer} workerid - worker runtime threadid
  * @param {object} hamster - web worker
  */
  hamsters.runtime.trainHamster = function(id, aggregate, callback, taskid, workerid, hamster, dataBlob) {
    /**
    * @description: Runs when a hamster (thread) finishes it's work
    * @constructor
    * @param {object} e - Web Worker event object
    */
    hamster.onmessage = function(e) {
      var queue = hamsters.runtime.queue;
      if(queue.pending.length === 0) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
        setTimeout(hamsters.runtime.terminateHamster(dataBlob), 4);
      }
      queue.running.splice(queue.running.indexOf(id), 1); //Remove thread from running pool
      var task = hamsters.runtime.tasks[taskid];
      if(!task) {
        hamsters.runtime.errors = hamsters.runtime.errors.concat(
          {
          'timeStamp': e.timeStamp, 
          'msg': 'Error, unable to match thread to task, throwing exception', 
          'taskid': taskid, 
          'workerid': workerid, 
          'aggregate': aggregate, 
          'callback': callback
          }
        );
        console.error('Fatal Exception, unable to match thread #'+workerid+' to task #'+ taskid + ', cannot continue. Check errors for more details');
        return;
      }
      task.workers.splice(task.workers.indexOf(workerid), 1); //Remove thread from task running pool
      var taskComplete = false;
      if(task.workers.length === 0 && task.count === task.threads) {
        taskComplete = true;
      }
      var results = e.data.results;
      if(results.dataType && typeof results.data === 'object') {
        results.data = hamsters.runtime.processDataType(results.dataType, results.data);
      }
      task.output[workerid] = results.data;
      var debug = hamsters.debug;
      if(debug === 'verbose') {
        console.info('Hamster #' + id + ' finished ' + '@ ' + e.timeStamp);
      }
      if(taskComplete) { //Task complete, finish up
        var output = hamsters.runtime.getOutput(task.output, aggregate, results.dataType);
        hamsters.runtime.tasks[taskid] = null; //Clean up our task, not needed any longer
        if(callback) {
          if(debug) {
            console.info('Execution Complete! Elapsed: ' + ((e.timeStamp - task.input[0].start)/1000) + 's');
          }
          callback(output);
        }
      }
      if(queue.pending.length !== 0) {
        hamsters.runtime.processQueue(hamster, dataBlob);
      }
    };
    /**
    * @description: Setup error handling
    * @constructor
    * @param {object} e - Web Worker event object
    */
    hamster.onerror = function(e) {
      hamster.terminate(); //Kill the thread
      var msg = 'Error Hamster #' + id + ': Line ' + e.lineno + ' in ' + e.filename + ': ' + e.message;
      hamsters.runtime.errors = hamsters.runtime.errors.concat(
        {
        'msg': msg
        }
      );
      console.error(msg);
    };
  };
  /**
  * @function convertArray
  * @description: Normalizes typed array into normal array
  * @constructor
  * @param {object} input - typedArray input
  */
  hamsters.runtime.convertArray = function(input) {
    var arr = [];
    for (var n = 0, len = input.length; n < len; n++) {
      arr.push(input[n]);
    }
    return arr;
  };
  /**
  * @function processDataType
  * @description: Converts array buffer or normal array into a typed array
  * @constructor
  * @param {string} dataType - dataType config param
  * @param {object} buffer - buffer object or normal array
  */
  hamsters.runtime.processDataType = function(dataType, buffer) {
    if(!dataType) {
      return buffer;
    }
    var arr;
    switch(dataType.toLowerCase()) {
      case 'uint32':
        arr = new Uint32Array(buffer);
      break;
      case 'uint16':
        arr = new Uint16Array(buffer);
      break;
      case 'uint8':
        arr = new Uint8Array(buffer);
      break;
      case 'uint8clamped':
        arr = new Uint8ClampedArray(buffer);
      break;
      case 'int32':
        arr = new Int32Array(buffer);
      break;
      case 'int16':
        arr = new Int16Array(buffer);
      break;
      case 'int8':
        arr = new Int8Array(buffer);
      break;
      case 'float32':
        arr = new Float32Array(buffer);
      break; 
      case 'float64':
        arr = new Float64Array(buffer);
      break;
      default:
        arr = buffer;
      break;
    }
    return arr;
  };
  /**
  * @function feedHamster
  * @description: Sends message to worker thread to invoke execution
  * @constructor
  * @param {object} hamster - web worker
  * @param {object} food - params object for worker
  */
  hamsters.runtime.feedHamster = function(hamster, food, inputArray) {
    if(inputArray && food.dataType) { //Transferable object transfer if using typed array
      food.array = hamsters.runtime.processDataType(food.dataType, inputArray);
    } else if(inputArray) {
      food.array = inputArray;
    }
    if(food.array && food.array.buffer) {
      var buffer = food.array.buffer;
      food.array = buffer;
      hamster.postMessage(food,  [buffer]);
    } else if((window.chrome || window.firefox) && food.array.length <= 35000000) { //Stringify data for chrome/firefox on less than 35M array size, good performance boost 
      hamster.postMessage(JSON.stringify(food));
    } else {
      hamster.postMessage(food); //Use structured cloning for Safari/IE or for data sets > 40M+
    }
  };
  //Setup
  hamsters.runtime.setup.isLegacy();
  hamsters.runtime.setup.populateElements(hamsters.maxThreads);
};
//Wake 'em up
hamsters.runtime.wakeUp();