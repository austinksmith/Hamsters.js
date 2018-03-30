/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersHabitat from './habitat';
import hamstersLogger from './logger';

'use strict';

class data {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.randomArray = this.randomArray;
    this.aggregateArrays = this.aggregateThreadOutputs;
    this.splitArrays = this.splitArrayIntoSubArrays;
    this.createBlob = this.createDataBlob;
    this.generateBlob = this.generateWorkerBlob;
    this.processDataType = this.processDataType;
    this.sortOutput = this.sortArray;
    this.getOutput = this.prepareOutput;
    this.prepareJob = this.prepareFunction;
    this.feedHamster = this.messageWorker;
    this.prepareMeal = this.prepareHamsterFood;
    this.workerURI = null;
  }

  /**
  * @function prepareHamsterFood - Prepares message to send to thread(s)
  * @param {object} task - Task to process
  */
  prepareHamsterFood(task) {
    let hamsterFood = task.input;
    for (var key in task.input) {
      if (task.input.hasOwnProperty(key) && key !== 'array') {
        hamsterFood[key] = task.input[key];
      }
    }
    hamsterFood.array = task.input.array;
    if (task.hamstersJob && !hamsterFood.hamstersJob) {
      hamsterFood.hamstersJob = hamstersJob;
    }
    return hamsterFood;
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
    return hamster.postMessage(hamsterFood, this.prepareTransferBuffers(hamsterFood));
  }

  /**
  * @function prepareTransferBuffers - Prepares transferrable buffers for faster message passing
  * @param {object} hamsterFood - Message to send to thread
  */
  prepareTransferBuffers(hamsterFood) {
    let buffers = [];
    let key = null;
    if(hamstersHabitat.transferrable) {
      for (key in hamsterFood) {
        if (hamsterFood.hasOwnProperty(key) && hamsterFood[key]) {
          if(hamsterFood[key].buffer) {
            buffers.push(hamsterFood[key].buffer);
          } else if(Array.isArray(hamsterFood[key]) && typeof ArrayBuffer !== 'undefined') {
            buffers.push(new ArrayBuffer(hamsterFood[key]));
          }
        }
      }
    }
    return buffers;
  }

  /**
  * @function prepareFunction - Prepares transferrable buffers for faster message passing
  * @param {function} functionBody - Message to send to thread
  */
  prepareFunction(functionBody) {
    if (!hamstersHabitat.legacy) {
      functionBody = String(functionBody);
      if (!hamstersHabitat.webWorker) {
        let startingIndex = (functionBody.indexOf("{") + 1);
        let endingIndex = (functionBody.length - 1);
        return functionBody.substring(startingIndex, endingIndex);
      }
    }
    return functionBody;
  }

  /**
  * @function generateWorkerBlob - Creates blob uri for flexible scaffold loading
  * @param {function} workerLogic - Scaffold to use within worker thread
  */
  generateWorkerBlob(workerLogic) {
    let functionString = '(' + String(workerLogic) + ')();';
    let hamsterBlob = this.createBlob(functionString);
    return URL.createObjectURL(hamsterBlob);
  }

  /**
  * @function processDataType - Converts buffer into new typed array
  * @param {string} dataType - Typed array type for this task
  * @param {object} buffer - Buffer to convert
  */
  processDataType(dataType, buffer) {
    if(hamstersHabitat.transferrable) {
      return this.typedArrayFromBuffer(dataType, buffer);
    }
    return buffer;
  }

  /**
  * @function prepareOutput - Prepares final task output
  * @param {task} buffer - Task to prepare output for
  */
  prepareOutput(task) {
    if(task.aggregate && task.threads !== 1) {
      return this.aggregateThreadOutputs(task.output, task.dataType);
    }
    return task.output;
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
      'uint32': Uint32Array,
      'uint16': Uint16Array,
      'uint8': Uint8Array,
      'uint8clamped': Uint8ClampedArray,
      'int32': Int32Array,
      'int16': Int16Array,
      'int8': Int8Array,
      'float32': Float32Array,
      'float64': Float64Array
    };
    if(!types[dataType]) {
      return dataType;
    }
    return new types[dataType](buffer);
  }


  /**
  * @function createDataBlob - Attempts to locate data blob builder, vender prefixes galore
  */
  locateBlobBuilder() {
    if(typeof BlobBuilder !== 'undefined') {
      return BlobBuilder;
    }
    if(typeof WebKitBlobBuilder !== 'undefined') {
      return WebKitBlobBuilder;
    }
    if(typeof MozBlobBuilder !== 'undefined') {
      return MozBlobBuilder;
    }
    if(typeof MSBlobBuilder !== 'undefined') {
      return MSBlobBuilder;
    }
    return hamstersLogger.error('Environment does not support data blobs!');
  }

  /**
  * @function createDataBlob - Creates new data blob from textContent
  * @param {string} textContent - Provided text content for blob
  */
  createDataBlob(textContent) {
    if(typeof Blob === 'undefined') {
      let BlobMaker = this.locateBlobBuilder();
      let blob = new BlobMaker();
      blob.append([textContent], {
        type: 'application/javascript'
      });
      return blob.getBlob();
    }
    return new Blob([textContent], {
      type: 'application/javascript'
    });
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
  aggregateThreadOutputs(input, dataType) {
    if(!dataType || !hamstersHabitat.transferrable) {
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
    let output = this.processDataType(dataType, bufferLength);
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
