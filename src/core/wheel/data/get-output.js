/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const aggregate = require("../../tools/array/aggregate-array");

module.exports = (output, aggregate, dataType) => {
  if(aggregate && output.length <= 20) {
    return aggregate(output, dataType);
  }
  return output;
};