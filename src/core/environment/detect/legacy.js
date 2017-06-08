
/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const supportsWorkers = require("../support/worker");
const supportsSharedWorkers = require("../support/shared-worker");
const isWorker = require("./worker");
const isShell = require("./shell");

const isLegacy = () => {
	if(isShell) {
		return true;
	}
	if(isWorker) {
		return !supportsSharedWorkers;
	}
	return !supportsWorkers;
};

module.exports = isLegacy();