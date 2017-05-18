/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const hamsterEnvironment = require("./environment/setup-environment");
const hamsterTools = require("./tools/hamster-tools");
const memoizer = require("./cache/memoize");
const threadPool = require("./pool/thread-pool");
const hamsterWheel = require("./processor/hamster-wheel");

module.exports = {
	version: "4.2.0",
	persistence: true,
	debug: false,
	cache: false,
	habitat: hamsterEnvironment,
	pool: threadPool,
	tools: hamsterTools,
	memoizer: memoizer,
	wheel: hamsterWheel,
	errors: [],

	init: (startOptions) => {
		if(typeof startOptions !== "undefined") {
			this.processStartOptions(startOptions);
		}
		this.wakeHamsters();
	},

	processStartOptions: (startOptions) => {
		let key;
	  for(key in startOptions) {
	    if(startOptions.hasOwnProperty(key)) {
	    	if(key === "maxThreads") {
	    		this.habitat.maxThreads = startOptions[key];
	    	} else {
	      	this[key] = startOptions[key];
	    	}
	    }
	  }
	},

	run: () => {

	},

	wakeHamsters: () => {
		if(this.env.browser) {
      hamsters.wheel.uri = URL.createObjectURL(createBlob('(' + String(giveHamsterWork()) + ')();'));
    }
    if(hamsters.persistence) {
      var i = hamsters.maxThreads;
      for (i; i > 0; i--) {
        if(hamsters.wheel.env.ie10) {
          hamsters.wheel.hamsters.push(new Worker('src/common/wheel.min.js'));
        }
        if(hamsters.wheel.env.worker) {
          hamsters.wheel.hamsters.push(new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel'));
        } else {
          hamsters.wheel.hamsters.push(new Worker(hamsters.wheel.uri));
        }
      }
    }
	}
};