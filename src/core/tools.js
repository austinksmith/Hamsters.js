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

class tools {
  constructor() {
    this.parseJson = this.parseJsonOnThread;
    this.stringifyJson = this.stringifyJsonOnThread;
  }


  parseJsonOnThread(string, onSuccess) {
    runHamsters({input: string}, function() {
      rtn.data = JSON.parse(params.input);
    }, function(output) {
      onSuccess(output[0]);
    }, 1);
  }

  stringifyJsonOnThread(json, onSuccess) {
    runHamsters({input: json}, function() {
      rtn.data = JSON.stringify(params.input);
    }, function(output) {
      onSuccess(output[0]);
    }, 1);
  }
}

var hamsterTools = new tools();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterTools;
}
