/* jshint esversion: 5, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/
  'use strict';

  const { parentPort } = require('worker_threads');


  if(typeof self === 'undefined') {
    let self = (global || window || this);
  }

  self.params = {};
  self.rtn = {};

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
    parentPort.postMessage(prepareReturn(rtn));
  };

  prepareReturn = (returnObject) => {
    let dataType = returnObject.dataType;
    if(dataType) {
      returnObject.data = typedArrayFromBuffer(dataType, returnObject.data);
    }
    return returnObject;
  };

  typedArrayFromBuffer = (dataType, buffer) => {
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

  prepareTransferBuffers = (hamsterFood) => {
    let buffers = [];
    let key, newBuffer;
    for (key of Object.keys(hamsterFood)) {
      newBuffer = null;
      if (hamsterFood[key]) {
        if(hamsterFood[key].buffer) {
          newBuffer = hamsterFood[key].buffer;
        } else if(Array.isArray(hamsterFood[key]) && typeof ArrayBuffer !== 'undefined') {
          newBuffer = new ArrayBuffer(hamsterFood[key]);
        }
      }
      if(newBuffer) {
        buffers.push(newBuffer);
        hamsterFood[key] = newBuffer;
      }
    }
    return {
      hamsterFood: hamsterFood,
      buffers: buffers
    };
  };