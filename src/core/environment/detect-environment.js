/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const supportsWorkers = require("./support/worker");
const supportsTransferrableObjects = require("./support/transferrable-object");
const supportsSharedWorkers = require("./support/shared-worker");
const supportsAtomics = require("./support/atomics");

const isNode = require("./detect/node");
const isBrowser = require("./detect/browser");
const isShell = require("./detect/shell");
const isReactNative = require("./detect/reactNative");
const isWorker = require("./detect/worker");
const isInternetExplorerTen = require("./detect/internetExplorerTen");
const isLegacy = require('./detect/legacy');

module.exports = {
	node: isNode,
	browser: isBrowser,
	worker: isWorker,
	reactNative: isReactNative,
	shell: isShell,
	atomics: supportsAtomics,
	transferrable: supportsTransferrableObjects,
	ie10: isInternetExplorerTen,
	legacy: isLegacy
};