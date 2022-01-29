/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class data {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    'use strict';

    this.getSubArrayFromIndex = this.getSubArrayUsingIndex;
    this.getSubArrayIndexes = this.calculateIndexes;
    this.sortOutput = this.sortTaskOutput;
    this.prepareFunction = this.prepareWorkerTask;
    this.feedHamster = this.messageWorkerThread;
  }

  /**
  * @function messageWorkerThread - Prepares message to send to thread
  * @param {worker} hamster - Thread to message
  * @param {object} hamsterFood - Message to send to thread
  */  
  messageWorkerThread(hamstersHabitat, hamster, hamsterFood) {
    if(hamstersHabitat.reactNative) {
      return hamster.postMessage(JSON.stringify(hamsterFood));
    }
    if (hamstersHabitat.webWorker) {
      return hamster.port.postMessage(hamsterFood);
    }
    if(typeof hamsterFood.array.buffer !== 'undefined') {
      hamster.postMessage(hamsterFood, [hamsterFood.array.buffer]);
    } else {
      hamster.postMessage(hamsterFood);
    }
  }

  /**
  * @function prepareWorkerTask - Prepares function for thread, strips whitespace
  * @param {function} functionBody - Message to send to thread
  */
  prepareWorkerTask(functionBody) {
    let functionString = String(functionBody);
    return functionString.substring((functionString.indexOf("{") + 1), (functionString.length -1));
  }

  /**
  * @function sortTaskOutput - Sorts array by defined order
  * @param {object} arr - Array to sort
  * @param {string} order - Defined sort order
  */
  sortTaskOutput(arr, order) {
    switch(order) {
      case 'desc':
      case 'asc':
        return Array.prototype.sort.call(arr, function(a, b) {
          return (order === 'asc' ? (a - b) : (b - a)); 
        });
      case 'ascAlpha':
        return arr.sort();
      case 'descAlpha':
        return arr.reverse();
      default:
        return arr;
    }
  }

  /**
  * @function addThreadOutputWithIndex - Joins individual thread outputs into single result
  * @param {array} input - Array of arrays to aggregate
  * @param {string} dataType - Data type to use for typed array
  */
  addThreadOutputWithIndex(task, index, output) {
    let i = 0;
    let outputLength = output.length;
    for (i; i < outputLength; i++) {
      task.input.array[(index.start + i)] = output[i];
    }
  }

  /**
  * @function calculateIndexes - Splits a single array into multiple equal sized subarrays
  * @param {array} array - Array to split
  * @param {number} n - Number of subarrays to create
  */
  calculateIndexes(array, n) {
    let indexes = [];
    let i = 0;
    let size = Math.ceil(array.length/n);
    while (i < array.length) {
      indexes.push({start: i, end: i += size});
    }
    return indexes;
  }

  /**
  * @function splitArrayIntoSubArrays - Splits a single array into multiple equal sized subarrays
  * @param {array} array - Array to split
  * @param {number} n - Number of subarrays to create
  */
  getSubArrayUsingIndex(index, task) {
    if(typeof task.input.array.slice === "function") {
      return task.input.array.slice(index.start, index.end);
    }
    return task.input.array.subarray(index.start, index.end);
  }
}

var hamstersData = new data();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersData;
}
