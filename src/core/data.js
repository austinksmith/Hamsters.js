class Data {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor(hamsters) {
    'use strict';

    this.hamsters = hamsters; // Set the hamsters object as a property of Data class
    this.getSubArrayFromIndex = this.getSubArrayUsingIndex.bind(this); // Bind getSubArrayUsingIndex function
    this.getSubArrayIndexes = this.calculateIndexes.bind(this); // Bind calculateIndexes function
    this.sortOutput = this.sortTaskOutput.bind(this); // Bind sortTaskOutput function
    this.aggregateThreadOutputs = this.aggregateThreadOutputs;
    this.processDataType = this.typedArrayFromBuffer;
    this.prepareFunction = this.prepareWorkerTask.bind(this); // Bind prepareWorkerTask function
    this.feedHamster = this.messageWorkerThread.bind(this); // Bind messageWorkerThread function
  }

  /**
  * @function messageWorkerThread - Prepares message to send to thread
  * @param {object} hamstersHabitat - Hamsters Habitat instance
  * @param {Worker} hamster - Thread to message
  * @param {object} hamsterFood - Message to send to thread
  */  
  messageWorkerThread(hamster, hamsterFood) {
    if(this.hamsters.habitat.reactNative) {
      return hamster.postMessage(JSON.stringify(hamsterFood));
    }
    if (this.hamsters.habitat.webWorker) {
      return hamster.port.postMessage(hamsterFood);
    }
    if(typeof hamsterFood.array.buffer !== 'undefined') {
      hamster.postMessage(hamsterFood, [hamsterFood.array.buffer]);
    } else {
      hamster.postMessage(hamsterFood);
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
        return buffer;
      }
      return new types[dataType](buffer);
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
  * @function aggregateThreadOutputs - Joins individual thread outputs into single result
  * @param {array} input - Array of arrays to aggregate
  * @param {string} dataType - Data type to use for typed array
  */
  aggregateThreadOutputs(input, dataType) {
    if(!dataType) {
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
  * @function addThreadOutputWithIndex - Joins individual thread outputs into single result
  * @param {object} task - Hamsters task object
  * @param {object} index - Index information
  * @param {array} output - Output array
  */
  addThreadOutputWithIndex(task, index, output) {
    let i = 0;
    let outputLength = output.length;
    for (i; i < outputLength; i++) {
      task.output[(index.start + i)] = output[i];
    }
  }

  /**
   * @function calculateIndexes - Splits a single array into multiple equal sized subarrays
   * @param {array} array - Array to split
   * @param {number} n - Number of subarrays to create
   */
  calculateIndexes(array, n) {
    // If n is 1, return the whole array range
    if (n === 1) {
      return [{ start: 0, end: array.length - 1 }];
    }

    const indexes = [];
    const segmentSize = Math.floor(array.length / n);
    let startIndex = 0;

    for (let i = 0; i < n; i++) {
      const endIndex = startIndex + segmentSize - 1;
      indexes.push({ start: startIndex, end: endIndex });
      startIndex = endIndex + 1;
    }

    // Adjust the last segment to cover any remaining elements
    if (startIndex < array.length) {
      indexes[n - 1].end = array.length - 1;
    }

    return indexes;
  }
  

  /**
  * @function getSubArrayUsingIndex - Slices subarray based on provided index
  * @param {object} index - Index information
  * @param {object} task - Hamsters task object
  */
  getSubArrayUsingIndex(index, task) {
    return task.input.array.slice(index.start, index.end + 1);
  }
}

module.exports = Data;
