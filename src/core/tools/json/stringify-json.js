/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

module.exports = (json, onSuccess) => {
  let params = {
  	input: inputJson
  };
  run({input: json}, () => {
    rtn.data = JSON.stringify(params.input);
  }, (output) => {
    onSuccess(output[0]);
  });
};