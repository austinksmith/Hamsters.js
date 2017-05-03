/*
* Title: WebHamsters
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

exports.hamsters = {

  version: false,
  debug: false,
  cache: false,
  persistence: false,
  maxThreads: 4,
  tools: require("./tools.js"),
  wheel: require("./wheel.js"),

  init: (startOptions) => {
    "use strict";

    function isIE(version) {
      return (new RegExp("msie" + (!Number.isNaN(version) ? ("\\s"+version) : ""), "i").test(navigator.userAgent));
    }

    function setupBrowserSupport() {
      if(!Worker || ["Kindle/3.0", "Mobile/8F190", "IEMobile"].indexOf(navigator.userAgent) !== -1) {
        this.wheel.env.legacy = true;
      }
      if(navigator.userAgent.toLowerCase().indexOf("firefox") !== -1) {
        this.maxThreads = (this.maxThreads > 20 ? 20 : this.maxThreads);
      }
      if(isIE(10)) {
        try {
          let hamster = new Worker("src/common/this.wheel.min.js");
          hamster.terminate();
          this.wheel.env.ie10 = true;
        } catch(e) {
          this.wheel.env.legacy = true;
        }
      }
    }

    function setupWorkerSupport() {
      try {
        this.wheel.uri = URL.createObjectURL(createBlob("(" + String(giveHamsterWork()) + "());"));
        const SharedHamster = new SharedWorker(this.wheel.uri, "SharedHamsterWheel");
        SharedHamster.terminate();
      } catch(e) {
        this.wheel.env.legacy = true;
      }
    }

    function processStartOptions() {
      let key;
      for(key in startOptions) {
        if(startOptions.hasOwnProperty(key)) {
          hamsters[key] = startOptions[key];
        }
      }
    }

    function setupHamstersEnvironment(onSuccess) {
      this.wheel.env.browser = typeof window === "object";
      this.wheel.env.worker  = typeof importScripts === "function";
      this.wheel.env.node = typeof process === "object" && typeof require === "function" && !this.wheel.env.browser && !this.wheel.env.worker && !this.wheel.env.reactNative;
      this.wheel.env.reactNative = !this.wheel.env.node && typeof global === "object";
      this.wheel.env.shell = !this.wheel.env.browser && !this.wheel.env.node && !this.wheel.env.worker && !this.wheel.env.reactNative;
      if(typeof navigator !== "undefined") {
        this.maxThreads = navigator.hardwareConcurrency;
      }
      if(typeof startOptions !== "undefined") {
        processStartOptions();
      }
      if(this.wheel.env.browser) {
        setupBrowserSupport();
      }
      if(this.wheel.env.worker) {
        setupWorkerSupport();
      }
      if(this.wheel.env.reactNative || this.wheel.env.node) {
        global.self = global;
      }
      if(this.wheel.env.shell || typeof Worker === "undefined") {
        this.wheel.env.legacy = true;
      }
      if(typeof Uint8Array === "undefined") {
        this.wheel.env.transferrable = false;
      }
      onSuccess();
    }

    function spawnHamsters() {
      if(typeof URL !== "undefined") {
        this.wheel.uri = URL.createObjectURL(createBlob("(" + String(giveHamsterWork()) + ")();"));
      }
      if(this.persistence) {
        let i = this.maxThreads;
        for (i; i > 0; i--) {
          this.wheel.this.push(this.wheel.newHamster());
        }
      }
    }

    function giveHamsterWork() {
      if(this.wheel.env.worker) {
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
      this.wheel.trackThread(task, this.wheel.queue.running, threadid);
      if(memoize || this.debug) {
        this.wheel.trackInput(inputArray, threadid, task, hamsterfood);
      }
      this.wheel.legacyProcessor((hamsterfood, inputArray, output) => {
        this.wheel.clean(task, threadid);
        task.output[threadid] = output.data;
        if(task.workers.length === 0 && task.count === task.threads) {
          callback(this.wheel.getOutput(task.output, aggregate, output.dataType));
          this.wheel.tasks[task.id] = null;
          if(this.cache && memoize !== false) {
            this.wheel.memoize(task.fn, task.input, output.data, output.dataType);
          }
        }
      });
      task.count += 1; //Thread finished
    }

    function hamsterWheel(inputArray, hamsterfood, aggregate, callback, task, threadid, hamster, memoize) {
      if(this.maxThreads === this.wheel.queue.running.length) {
        this.wheel.poolThread(inputArray, hamsterfood, threadid, callback, task, aggregate, memoize);
        return;
      }
      if(memoize || this.debug) {
        this.wheel.trackInput(inputArray, threadid, task, hamsterfood);
      }
      if(!hamster) {
        if(this.persistence) {
          hamster = this.wheel.hamsters[this.wheel.queue.running.length];
        } else {
          hamster = this.wheel.newHamster();
        }
      }
      this.wheel.trainHamster(threadid, aggregate, callback, task, hamster, memoize);
      this.wheel.trackThread(task, this.wheel.queue.running, threadid);
      hamsterfood.array = inputArray;
      this.wheel.feedHamster(hamster, hamsterfood);
      task.count += 1; //Increment count, thread is running
      if(this.debug === "verbose") {
        console.info("Spawning Hamster #" + threadid + " @ " + new Date().getTime());
      }
    }

    function chewGarbage() {
      delete this.init;
      startOptions = null;
    }

    setupHamstersEnvironment(() => {
      if(this.wheel.env.legacy) {
        this.wheel.newWheel = legacyHamsterWheel;
      } else {
        this.wheel.newWheel = hamsterWheel;
        spawnHamsters();
      }
      chewGarbage();
    });
  }
};