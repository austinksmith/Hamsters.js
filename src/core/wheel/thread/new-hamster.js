"use strict";


const environment = require("../../environment/setup-environment");
const uri = require("../../environment/uri");

module.exports = () => {
  if(environment.worker) {
    return new SharedWorker(uri, "SharedHamsterWheel");
  }
  if(environment.ie10) {
    return new Worker("../../common/wheel.min.js");
  }
  return new Worker(uri);
};