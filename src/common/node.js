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

global.rtn = {};
global.params = {};

parentPort.on('message', (message) => {
  params = message;
  rtn = {
    data: [],
    dataType: (typeof params.dataType !== 'undefined' ? params.dataType : null)
  };
  try {
    eval(params.hamstersJob);
    if (rtn.dataType) {
      rtn.data = typedArrayFromBuffer(rtn.dataType, rtn.data);
    }
    returnResponse(rtn);
  } catch (error) {
    console.error("Error executing job:", error);
    returnResponse({ error: error.message });
  }
});

function returnResponse(rtn, buffers) {
  if (typeof rtn.data !== 'undefined' && typeof rtn.data.buffer !== 'undefined') {
    parentPort.postMessage(rtn, [rtn.data.buffer]);
  } else {
    parentPort.postMessage(rtn);
  }
}

function typedArrayFromBuffer(dataType, buffer) {
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