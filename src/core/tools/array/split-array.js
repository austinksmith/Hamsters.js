/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

module.exports = (array, n) => {
  let i = 0;
  let tasks = [];
  let size = Math.ceil(array.length/n);
  if(array.slice) {
    while(i < array.length) {
      tasks.push(array.slice(i, i += size));
    }
  } else {
    while (i < array.length) {
      tasks.push(array.subarray(i, i += size));
    }
  }
  return tasks;
};