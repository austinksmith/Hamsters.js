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

const hasFullSupport = () => {
	if(isShell()) {
		return false;
	}
	if(isWorker()) {
		return supportsSharedWorkers;
	}
	return supportsWorkers;
};

const isBrowser = () => {
	return (typeof window === "object");
};

const isInternetExplorer = (version) => {
	if(typeof navigator === "undefined" || !isBrowser()) {
		return false;
	}
	return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
};

const isNode = () => {
	return (typeof process === "object" && typeof require === "function");
};

const isWorker = () => {
	return (typeof importScripts === "function");
};

const isReactNative = () => {
	return (isNode() === false && typeof global === "object");
};

const isShell = () => {
	return (!isBrowser() && !isNode() && !isWorker() && !isReactNative());
};

module.exports = {
	node: isNode(),
	browser: isBrowser(),
	worker: isWorker(),
	reactNative: isReactNative(),
	shell: isShell(),
	transferrable: supportsTransferrableObjects,
	ie10: isInternetExplorer(10),
	legacy: !hasFullSupport()
};