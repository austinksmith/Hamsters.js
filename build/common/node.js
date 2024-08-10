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

global.params = {};
global.rtn = {};

parentPort.on('message', (message) => {
  params = message;
  rtn = {
    data: [],
    dataType: (typeof params.dataType !== 'undefined' ? params.dataType : null),
    index: params.index
  };

  if (params.sharedBuffer) {
    params.sharedArray = typedArrayFromBuffer(params.dataType, params.sharedBuffer);
  }

  eval(params.hamstersJob);

  returnResponse(rtn);
});

function returnResponse(rtn) {
  const buffers = getTransferableObjects(rtn);
  if (buffers.length > 0) {
    // If there are buffers, postMessage with transferable objects
    parentPort.postMessage(rtn, buffers);
  } else {
    // Otherwise, postMessage without transferable objects
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

function getTransferableObjects(obj) {
  const transferableObjects = new Set();
  const typedArrayTypes = [
    'Int32Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 
    'Uint16Array', 'Uint32Array', 'Float32Array', 'Float64Array'
  ];
  const otherTransferables = [
    'ArrayBuffer', 'MessagePort', 'ImageBitmap', 'OffscreenCanvas'
  ];

  const globalContext = typeof self !== 'undefined' ? self : this;

  const allTypes = [...typedArrayTypes, ...otherTransferables];

  for (const prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      for (const type of allTypes) {
        if (typeof globalContext[type] !== 'undefined' && obj[prop] instanceof globalContext[type]) {
          if (typedArrayTypes.includes(type)) {
            transferableObjects.add(obj[prop].buffer);
          } else {
            transferableObjects.add(obj[prop]);
          }
        }
      }
    }
  }

  return Array.from(transferableObjects);
}
