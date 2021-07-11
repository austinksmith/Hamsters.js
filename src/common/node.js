/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

const { Worker, parentPort } = require('worker_threads');

(function() {

  global.rtn = {};
  global.params = {};

  parentPort.once('message', (message) => {
    params = message;
    rtn = {
      data: [],
      dataType: (typeof params.dataType !== 'undefined' ? params.dataType : null)
    };
    eval(params.hamstersJob);
    returnResponse(rtn);
  });

  const returnResponse = function(rtn) {
    if(rtn.dataType) {
      rtn.data = typedArrayFromBuffer(rtn.dataType, rtn.data);
      prepareTransferBuffers(rtn, []);
    } else {
      parentPort.postMessage(rtn);
    }
  }

  const typedArrayFromBuffer = function(dataType, buffer) {
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
    if (!types[dataType]) {
      return buffer;
    }
    return new types[dataType](buffer);
  }

  const prepareTransferBuffers = function(rtn, buffers) {
    Object.keys(rtn).forEach(function(key) {
      let item = rtn[key];
      if(typeof item.buffer !== 'undefined') {
        buffers.push(item.buffer);
      } else {
        if(Array.isArray(rtn[key]) && typeof ArrayBuffer !== 'undefined') {
          buffers.push(new ArrayBuffer(rtn[key]));
        }
      }
    });
    return parentPort.postMessage(rtn, buffers);
  }
}());
