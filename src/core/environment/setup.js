

const setupBrowserSupport = () => {

};

const spawnHamsters = () => {
  if(typeof URL !== "undefined") {
    this.uri = URL.createObjectURL(createBlob("(" + String(giveHamsterWork()) + ")();"));
  }
  if(hamsters.persistence) {
    let i = hamsters.maxThreads;
    for (i; i > 0; i--) {
      this.threads.push(newHamster());
    }
  }
};

const setupWorkerSupport = () => {
	 try {
    hamsters.wheel.uri = URL.createObjectURL(createBlob("(" + String(giveHamsterWork()) + "());"));
    const SharedHamster = new SharedWorker(hamsters.wheel.uri, "SharedHamsterWheel");
    SharedHamster.terminate();
  } catch(e) {
    hamsters.wheel.env.legacy = true;
  }
};

const processStartOptions = () => {
  let key;
  for(key in startOptions) {
    if(startOptions.hasOwnProperty(key)) {
      this[key] = startOptions[key];
    }
  }
};
 
module.exports = (startOptions) => {
	"use strict";

	let maxThreads = 4;
	let transferrable = (typeof Uint8Array !== "undefined");
	let browser = (typeof window === "object");
	let worker  = (typeof importScripts === "function");
	let node = (typeof process === "object" && typeof require === "function" && !browser && !worker && !reactNative);
	let reactNative = (!node && typeof global === "object");
	let shell = (!browser && !node && !worker && !reactNative);
	
	if(typeof navigator !== "undefined") {
	  maxThreads = navigator.hardwareConcurrency;
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
	
	if() {
	  hamsters.wheel.env.transferrable = false;
	}
	
	return {
		maxThreads: maxThreads,
		transferrable:
	};
};