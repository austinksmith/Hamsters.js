/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const runningTasks = require('../../pool/thread-pool').runningTasks;

module.exports = (task, id) => {
	runningTasks.splice(hamsters.wheel.queue.running.indexOf(id), 1); //Remove thread from running pool
  task.workers.splice(task.workers.indexOf(id), 1); //Remove thread from task running pool
};