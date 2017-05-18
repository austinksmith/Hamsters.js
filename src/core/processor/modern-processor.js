/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const trainHamster = require('../wheel/thread/train-hamster');
const newHamster = require('../wheel/thread/new-hamster');
const trackHamster = require('../wheel/thread/track-hamster');
const feedHamster = require('../wheel/thread/feed-hamster');
const threadPool = require('../pool/thread-pool');
const memoizer = require('../cache/mmemoizer');

module.exports = (inputArray, parameters, aggregate, onSuccess, task, id, thread, memoize) => {
  // if(maxThreads === queue.running.length) {
  //   poolThread(inputArray, params, threadid, callback, task, aggregate, memoize);
  //   return;
  // }
  if(memoize || debug) {
    trackInput(inputArray, threadid, task, hamsterfood);
  }
  if(!hamster) {
    if(hamsters.persistence) {
      hamster = hamsters.wheel.hamsters[hamsters.wheel.queue.running.length];
    } else {
      hamster = newHamster();
    }
  }
  trainHamster(threadid, aggregate, callback, task, hamster, memoize);
  trackThread(task, hamsters.wheel.queue.running, threadid);
  hamsterfood.array = inputArray;
  feedHamster(hamster, hamsterfood);
  task.count += 1; //Increment count, thread is running
  if(hamsters.debug === "verbose") {
    console.info("Spawning Hamster #" + threadid + " @ " + new Date().getTime());
  }
};