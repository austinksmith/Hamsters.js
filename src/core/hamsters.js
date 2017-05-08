/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const libraryVersion = "4.2.0";
const defaultMaxThreads = 4;
const detectedEnvironment = require("./environment/setup-environment");
const hamsterTools = require("./tools/hamster-tools");

let spawnedHamsters = [];
let memoizeCache = require("./cache/memoize");
let threadPool = require("./pool/thread-pool");
let defaultOptions = new Object({
	maxThreads: defaultMaxThreads,
	persistence: true,
	debug: false,
	cache: false,
	Worker: null
});

const wakeHamsters = (startOptions) => {
	console.log("WOKE!");
};

const processStartOptions = (startOptions) => {
  let key;
  for(key in startOptions) {
    if(startOptions.hasOwnProperty(key)) {
      defaultOptions[key] = startOptions[key];
    }
  }
};

const hamsterRunner = () => {

};

module.exports = (startOptions) => {
	if(typeof startOptions !== "undefined") {
		processStartOptions(startOptions);
	}

	return new Object({
		version: libraryVersion,
		maxThreads: defaultOptions.maxThreads,
		debug: defaultOptions.debug,
		persistence: defaultOptions.persistence,
		cache: defaultOptions.cache,
		environment: detectedEnvironment,
		pool: threadPool,
		memoizer: memoizeCache,
		hamsters: spawnedHamsters,
		tools: hamsterTools,
		run: hamsterRunner,
		errors: []
	});
};