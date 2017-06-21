/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const environment = require('../../environment/setup-environment');

module.exports = (hamster, food) => {
  if(environment.worker) {
    return hamster.port.postMessage(food);
  }
  if(environment.ie10) {
    return hamster.postMessage(food);
  }
  let buffers = [], key;
  for(key in food) {
    if(food.hasOwnProperty(key) && food[key] && food[key].buffer) {
      buffers.push(food[key].buffer);
    }
  }
  return hamster.postMessage(food,  buffers);
};