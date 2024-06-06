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
