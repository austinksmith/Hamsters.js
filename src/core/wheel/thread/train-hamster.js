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
const onMessage = require('./on-message');
const onError = require('./on-error');

module.exports = (id, aggregate, callback, task, hamster, memoize) => {
  let trainingMessageData = onMessage(id, aggregate, callback, task, hamster, memoize);
  let trainingErrorData = onError(id, aggregate, callback, task, hamster, memoize);
  
  if(environment.worker) {
    hamster.port.onmessage = trainingMessageData;
    hamster.port.onerror = trainingErrorData;
  } else {
    hamster.onmessage = trainingMessageData;
    hamster.onerror = trainingErrorData;
  }   
},