/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

module.exports = (input, onSuccess) => {
  let params = {
    run: prepareFunction(input.operator),
    init: input.startIndex || 0,
    limit: input.limit,
    array: input.array,
    incrementBy: input.incrementBy || 1,
    dataType: input.dataType || null,
    worker: environment.worker
  };

  run(params, () => {
    let operator = params.run;
    if(typeof operator === "string") {
      if(params.worker) {
        operator = eval("(" + operator + ")");
      } else {
        operator = new Function(operator);
      }
    }
    if(!params.limit) {
      params.limit = params.array.length;
    }
    let i = params.init;
    for (i; i < params.limit; i += params.incrementBy) {
      rtn.data[i] = operator(params.array[i]);
    }
  }, (output) => {
    onSuccess(output);
  }, input.threads, 1, input.dataType);
};