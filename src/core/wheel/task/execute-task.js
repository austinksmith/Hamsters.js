/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const splitArray = require('../../tools/array/split-array');
const prepareFunction = require('./prepare-function');
const newWheel = require('../hamster-wheel');

module.exports = (task, params, fn, callback, aggregate, dataType, memoize, order) => {
  let workArray = params.array || null;
  if(params.array && task.threads !== 1) {
    workArray = splitArray(params.array, task.threads); //Divide our array into equal array sizes
  }
  let food = {};
  let key;
  for(key in params) {
    if(params.hasOwnProperty(key) && key !== "array") {
      food[key] = params[key];
    }
  }
  food.fn = prepareFunction(fn);
  food.dataType = dataType;
  let i = 0;
  while(i < task.threads) {
    if(workArray && task.threads !== 1) {
      newWheel(workArray[i], food, aggregate, callback, task, task.count, null, memoize);
    } else {
      newWheel(workArray, food, aggregate, callback, task, task.count, null, memoize);
    }
    i += 1;
  }
};