/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

module.exports = {
	cacheStore: new Object({

	}),
	checkCache: (fn, input, dataType) => {
    let cachedResult = this.cacheStore[fn];
    if(cachedResult) {
      if(cachedResult[0] === input && cachedResult[2] === dataType) {
        return cachedResult;
      }
    }
  },
  cacheOutput: (fn, inputArray, output, dataType) => {
    this.cacheStore[fn] = [inputArray, output, dataType];
  }
};