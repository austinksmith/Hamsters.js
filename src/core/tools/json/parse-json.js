/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const run = require("../");

module.exports = (inputString, onSuccess) => {
	let params = {
		input: inputString
	};
  run(params, () => {
    rtn.data = JSON.parse(params.input);
  }, (output) => {
    onSuccess(output[0]);
  });
};