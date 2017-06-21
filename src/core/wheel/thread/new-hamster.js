/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";


const environment = require("../../environment/setup-environment");
const giveHamsterWork = require("../../processor/hamster-worker");
const uri = require("../data/new-uri");

module.exports = () => {
  if(environment.ie10) {
		return new Worker("../../../common/wheel.min.js");
  } else if(environment.node) {
    return new Worker(giveHamsterWork());
  } else if(environment.worker) {
    return new SharedWorker(hamsters.wheel.uri, 'SharedHamsterWheel');
  } else {
    return new Worker(uri);
  }
};


