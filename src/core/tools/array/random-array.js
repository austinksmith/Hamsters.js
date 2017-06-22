/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const executeTask = require("../../hamsters-run");

module.exports = (inputAmount, onSuccess) => {
  var params = {
    count: inputAmount
  };
  executeTask(params, () => {
    while(params.count > 0) {
      rtn.data[rtn.data.length] = Math.round(Math.random() * (100 - 1) + 1);
      params.count -= 1;
    }
  }, (result) => {
    onSuccess(result);
  });
};