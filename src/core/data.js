/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

'use strict';

import hamstersHabitat from './habitat';
import hamstersLogger from './logger';

class data {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.randomArray = this.randomArray;
    this.aggregateArrays = this.aggregateThreadOutputs;
    this.splitArrays = this.splitArrayIntoSubArrays;
    this.generateWorkerBlob = this.generateWorkerBlob;
    this.processDataType = this.processDataType;
    this.sortOutput = this.sortArray;
    this.getOutput = this.prepareOutput;
    this.prepareJob = this.prepareFunction;
    this.feedHamster = this.messageWorker;
  }

  /**
  * @function messageWorker - Prepares message to send to thread
  * @param {worker} hamster - Thread to message
  * @param {object} hamsterFood - Message to send to thread
  */  
  messageWorker(hamster, hamsterFood) {
    if(hamstersHabitat.reactNative) {
      return hamster.postMessage(JSON.stringify(hamsterFood));
    }
    if (hamstersHabitat.ie10) {
      return hamster.postMessage(hamsterFood);
    }
    if (hamstersHabitat.webWorker) {
      return hamster.port.postMessage(hamsterFood);
    }
    if(hamstersHabitat.node && typeof hamstersHabitat.parentPort !== 'undefined') {
      return hamsters.parentPort.postMessage(hamstersFood);
    }
    let preparedTransfer = this.prepareTransferBuffers(hamsterFood);
    return hamster.postMessage(preparedTransfer['hamsterFood'], preparedTransfer['buffers']);
  }

  /**
  * @function prepareTransferBuffers - Prepares transferable buffers for faster message passing
  * @param {object} hamsterFood - Message to send to thread
  */
  prepareTransferBuffers(hamsterFood, transferable) {
    let buffers = [];
    let key, newBuffer;
    if(hamstersHabitat.transferable) {
      for (key of Object.keys(hamsterFood)) {
        newBuffer = null;
        if(hamsterFood[key].buffer) {
          newBuffer = hamsterFood[key].buffer;
        } else if(Array.isArray(hamsterFood[key]) && typeof ArrayBuffer !== 'undefined') {
          newBuffer = new ArrayBuffer(hamsterFood[key]);
        }
        if(newBuffer) {
          buffers.push(newBuffer);
          hamsterFood[key] = newBuffer;
        }
      }
    }
    return {
      hamsterFood: hamsterFood,
      buffers: buffers
    };
  }

  /**
  * @function prepareFunction - Prepares function for thread, strips whitespace
  * @param {function} functionBody - Message to send to thread
  */
  prepareFunction(functionBody) {
    if(hamstersHabitat.webWorker) {
      return functionBody;
    }
    let functionString = String(functionBody);
    return functionString.substring((functionString.indexOf("{") + 1), (functionString.length -1));
  }

  /**
  * @function processDataType - Converts buffer into new typed array
  * @param {string} dataType - Typed array type for this task
  * @param {object} buffer - Buffer to convert
  */
  processDataType(dataType, buffer, transferable) {
    if(transferable) {
      return this.typedArrayFromBuffer(dataType, buffer);
    }
    return buffer;
  }

  /**
  * @function prepareOutput - Prepares final task output
  * @param {task} buffer - Task to prepare output for
  */
  prepareOutput(task, transferable) {
    if(task.threads === 1) {
      return task.output[0];
    }
    if(task.aggregate) {
      return this.aggregateThreadOutputs(task.output, task.dataType, transferable);
    }
  }

  /**
  * @function sortArray - Sorts array by defined order
  * @param {object} arr - Array to sort
  * @param {string} order - Defined sort order
  */
  sortArray(arr, order) {
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
  * @function typedArrayFromBuffer - Converts buffer into new typed array
  * @param {string} dataType - Typed array type for this task
  * @param {object} buffer - Buffer to convert
  */
  typedArrayFromBuffer(dataType, buffer) {
    const types = {
      'Uint32': Uint32Array,
      'Uint16': Uint16Array,
      'Uint8': Uint8Array,
      'Uint8clamped': Uint8ClampedArray,
      'Int32': Int32Array,
      'Int16': Int16Array,
      'Int8': Int8Array,
      'Float32': Float32Array,
      'Float64': Float64Array
    };
    if(!types[dataType]) {
      return dataType;
    }
    return new types[dataType](buffer);
  }

  /**
  * @function randomArray - Creates new random array
  * @param {number} count - Number of random elements in array
  * @param {function} onSuccess - onSuccess callback
  */
  randomArray(count, onSuccess) {
    var randomArray = [];
    while(count > 0) {
      randomArray.push(Math.round(Math.random() * (100 - 1) + 1));
      count -= 1;
    }
    onSuccess(randomArray);
  }

  /**
  * @function aggregateThreadOutputs - Joins individual thread outputs into single result
  * @param {array} input - Array of arrays to aggregate
  * @param {string} dataType - Data type to use for typed array
  */
  aggregateThreadOutputs(input, dataType, transferable) {
    if(!dataType || !transferable) {
      return input.reduce(function(a, b) {
        return a.concat(b);
      });
    }
    let i = 0;
    let len = input.length;
    let bufferLength = 0;
    for (i; i < len; i += 1) {
      bufferLength += input[i].length;
    }
    let output = this.processDataType(dataType, bufferLength, transferable);
    let offset = 0;
    for (i = 0; i < len; i += 1) {
      output.set(input[i], offset);
      offset += input[i].length;
    }
    return output;
  }

  /**
  * @function splitArrayIntoSubArrays - Splits a single array into multiple equal sized subarrays
  * @param {array} array - Array to split
  * @param {number} n - Number of subarrays to create
  */
  splitArrayIntoSubArrays(array, n) {
    let i = 0;
    let threadArrays = [];
    let size = Math.ceil(array.length/n);
    if(array.slice) {
      while(i < array.length) {
        threadArrays.push(array.slice(i, i += size));
      }
    } else {
      while (i < array.length) {
        threadArrays.push(array.subarray(i, i += size));
      }
    }
    return threadArrays;
  }
}

var hamstersData = new data();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersData;
}
