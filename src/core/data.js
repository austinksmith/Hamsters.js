/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

/* jshint esversion: 6 */

'use strict';

class data {
  constructor() {
    this.randomArray = this.randomArray;
    this.aggregateArrays = this.aggregateThreadOutputs;
    this.splitArrays = this.splitArrayIntoSubArrays;
    this.createBlob = this.createDataBlob;
    this.determineSubArrays = this.determineSubArrayIndexes;
    this.arrayFromIndex = this.subArrayFromIndex;
    this.processDataType = this.processDataType;
    this.sortOutput = this.sortArray;
    this.getOutput = this.prepareOutput;
  }

  processDataType(dataType, buffer, transferrable) {
    if(transferrable) {
      return this.typedArrayFromBuffer(dataType, buffer);
    }
    return buffer;
  }

  prepareOutput(task, transferrable) {
    if(task.aggregate && task.threads !== 1) {
      return this.aggregateThreadOutputs(task.output, task.dataType, transferrable);
    }
    return task.output;
  }

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

  determineSubArrayIndexes(array, n) {
    if(n === 1) {
      return 
    }
    var i = 0;
    var size = Math.ceil(array.length/n);
    var indexes = [];
    while(i < array.length) {
      var start = i;
      var end = ((i += size) - 1);
      if(end > array.length -1) {
        end = array.length;
      }
      var index = { start: start, end: end };
      console.log(start, i, end);
      indexes.push(index);
    }
    console.log(indexes);
    return indexes;
  }

  subArrayFromIndex(array, index) {
    if(array.slice) {
      return array.slice(index.start, index.end);
    } else {
      return array.subarray(index.start, index.end);
    }
  }

  createDataBlob(textContent) {
    if(typeof Blob === 'undefined') {
      let BlobMaker = (BlobBuilder || WebKitBlobBuilder || MozBlobBuilder || MSBlobBuilder);
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

  randomArray(count, onSuccess) {
    var randomArray = [];
    while(count > 0) {
      randomArray.push(Math.round(Math.random() * (100 - 1) + 1));
      count -= 1;
    }
    onSuccess(randomArray);
  }

  aggregateThreadOutputs(input, dataType, transferrable) {
    if(!dataType || !transferrable) {
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
    let output = this.processDataType(dataType, bufferLength, transferrable);
    let offset = 0;
    for (i = 0; i < len; i += 1) {
      output.set(input[i], offset);
      offset += input[i].length;
    }
    return output;
  }

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

var hamsterData = new data();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterData;
}
