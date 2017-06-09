/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const environment = require("../environment/setup-environment");
const workerWorker = require("./worker/worker-worker");
const worker = require("./worker/worker");

module.exports = () => {
	if(environment.worker) {
    return workerWorker;
  }
  return worker;
};
