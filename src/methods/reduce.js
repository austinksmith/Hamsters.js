/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

/* jshint esversion: 6 */

'use strict';

class hamsterReduce {
  constructor() {
    this.options = this.prepareOptions;
    this.scaffold = this.loopScaffold;
  }

  prepareOptions(input, worker) {
    this.init = (input.startIndex || 0);
    this.limit = (input.limit || null);
    this.array = (input.array || null);
    this.incrementBy = (input.incrementBy || 1);
    this.dataType = (input.dataType || null);
    this.worker = worker;
  }

  reduceScaffold() {
    let operator = prepareOperator(params.run);

    function prepareOperator(method) {
      if (typeof method === 'string') {
        if (params.worker) {
          method = eval("(" + method + ")");
        } else {
          method = new Function(method);
        }
      }
      return method;
    };

    function runLoop(params, operator) {
      if (!params.limit) {
        params.limit = params.array.length;
      }
      var i = params.init;
      for (i; i < params.limit; i += params.incrementBy) {
        rtn.data[i] = operator(params.array[i]);
      }
    };

    runLoop(params, operator);
  }
}

var hamstersReduce = new hamsterReduce();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersReduce;
}
