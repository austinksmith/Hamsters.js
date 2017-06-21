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
const processDataType = require("../../wheel/data/process-data").processDataType;

module.exports = (input, dataType) => {
  if(!dataType || !environment.transferrable) {
    return input.reduce((a, b) => a.concat(b));
  }
  let i = 0;
  let len = input.length;
  let bufferLength = 0;
  for (i; i < len; i += 1) {
    bufferLength += input[i].length;
  }
  let output = processDataType(dataType, bufferLength);
  let offset = 0;
  for (i = 0; i < len; i += 1) {
    output.set(input[i], offset);
    offset += input[i].length;
  }
  return output;
};