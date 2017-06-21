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

module.exports = (id, aggregate, callback, task, hamster, memoize) => {
  return (e) => {
    if(!environment.worker) {
      hamster.terminate(); //Kill the thread
    }
    // errors.push({
    //   msg: "Error Hamster #" + id + ": Line " + e.lineno + " in " + e.filename + ": " + e.message
    // });
    console.error("Error Hamster #" + id + ": Line " + e.lineno + " in " + e.filename + ": " + e.message);
  }  
},