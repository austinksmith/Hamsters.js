"use strict";


const environment = require("../../environment/setup");
const sortOutput = require("../../tools/array/sort-array");
const getOutput = require("../../tools/array/sort-array");

const persistence = true;
const debug = true;
const cache = false;
const memoize = false;
let errors = [];
const threadPool = require("../../pool/thread-pool");
const clean = (task, id) = => {

};

module.exports = (id, aggregate, callback, task, hamster, memoize) => {
    function onmessage {
      clean(task, id);
      results = e.data.results;
      task.output[id] = results.data;
      if(debug === "verbose") {
        console.info("Hamster #" + id + " finished " + "@ " + e.timeStamp);
      }
      if(task.workers.length === 0 && task.count === task.threads) {
        if(task.order) {
          callback(sortOutput(getOutput(task.output, aggregate, results.dataType), task.order));
        } else {
          callback(getOutput(task.output, aggregate, results.dataType));
        }
        if(debug) {
          console.info("Execution Complete! Elapsed: " + ((e.timeStamp - task.input[0].start)/1000) + "s");
        }
        tasks[task.id] = null; //Clean up our task, not needed any longer
      }
      if(threadPool.pendingTasks.length !== 0) {
        processQueue(hamster, threadPool.pendingTasks.shift());
      } else if(!persistence && !environment.worker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    }

    function onerror(e) {
      if(!environment.worker) {
        hamster.terminate(); //Kill the thread
      }
      errors.push({
        msg: "Error Hamster #" + id + ": Line " + e.lineno + " in " + e.filename + ": " + e.message
      });
      console.error("Error Hamster #" + id + ": Line " + e.lineno + " in " + e.filename + ": " + e.message);
    }

    if(environment.worker) {
      hamster.port.onmessage = onmessage;
      hamster.port.onerror = onerror;
    } else {
      hamster.onmessage = onmessage;
      hamster.onerror = onerror;
    }   
  },