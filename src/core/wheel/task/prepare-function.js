/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const environment = require('../../environment/setup-environment');

module.exports = (functionBody) => {    
	if(!environment.legacy) {
    let stringifiedFunction = String(functionBody);
    
    if(!environment.worker) {
      var startingIndex = (stringifiedFunction.indexOf("{") + 1);
      var endingIndex = (stringifiedFunction.length - 1);
      return stringifiedFunction.substring(startingIndex, endingIndex);
    }
  }
  return functionBody;
}