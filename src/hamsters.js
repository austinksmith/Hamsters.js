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

  version: "4.2.0",
  debug: false,
  cache: false,
  persistence: false,
  maxThreads: 4,
  tools: require("./hamsters-tools"),
  wheel: require("./hamsters-wheel"),

  run: (params, fn, callback, workers, aggregate, dataType, memoize, order) => {
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
  },

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

module.exports = hamsters;