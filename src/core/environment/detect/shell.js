
/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const isBrowser = require("./browser");
const isNode = require("./node");
const isWorker = require("./worker");
const isReactNative = require("./reactNative");

const isShell = () => {
	return (!isBrowser && !isNode && !isWorker && !isReactNative);
};

module.exports = isShell();