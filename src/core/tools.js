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

class tools {
  constructor() {
    this.randomArray = this.randomArray;
    this.aggregateArrays = this.aggregateThreadOutputs;
    this.splitArrays = this.splitArrayIntoSubArrays;
  }

  randomArray(count, onSuccess) {
    var randomArray = [];
    while(count > 0) {
      randomArray.push(Math.round(Math.random() * (100 - 1) + 1));
      count -= 1;
    }
    onSuccess(randomArray);
  }

  aggregateThreadOutputs(input, dataType) {
    if(!dataType || !this.habitat.transferrable) {
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

var hamsterTools = new tools();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterTools;
}
