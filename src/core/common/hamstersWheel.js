/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

const { parentPort } = require('worker_threads');

var self = (self || this || window || global);

self.params = {};
self.rtn = {};

const prepareReturn = (returnObject) => {
  let dataType = returnObject.dataType;
  if(dataType) {
    returnObject.data = typedArrayFromBuffer(dataType, returnObject.data);
  }
  return returnObject;
};

const typedArrayFromBuffer = (dataType, buffer) => {
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
  if (!types[dataType]) {
    return buffer;
  }
  return new types[dataType](buffer);
};

const prepareTransferBuffers = (hamsterFood) => {
  let key, buffers = [];
  for(key in hamsterFood) {
    if(hamsterFood.hasOwnProperty(key)) {
      if(typeof hamsterFood[key].buffer !== 'undefined') {
        buffers.push(hamsterFood[key].buffer);
      }
    }
  }
  return buffers;
};

self.onmessage = (incomingMessage) => {
  params = incomingMessage.data;
  rtn = {
    data: [],
    dataType: (params.dataType ? params.dataType.toLowerCase() : null)
  };
  if(params.importScripts) {
    self.importScripts(self.params.importScripts);
  }
  new Function(params.hamstersJob)();
  rtn = prepareReturn(rtn);
  parentPort.postMessage(rtn, prepareTransferBuffers(rtn));
};

