/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/*
 * Title: Hamsters.js
 * Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library
 * Author: Austin K. Smith
 * Contact: austin@asmithdev.com
 * Copyright: 2015 Austin K. Smith - austin@asmithdev.com
 * License: Artistic License 2.0
 */

'use strict';

(function)() {
  self.typedArrayFromBuffer = function(dataType, buffer) {
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

  self.prepareTransferBuffers = function(hamsterFood) {
    let buffers = [];
    let key = null;
    for (key in hamsterFood) {
      if (hamsterFood.hasOwnProperty(key) && hamsterFood[key]) {
        if(hamsterFood[key].buffer) {
          buffers.push(hamsterFood[key].buffer);
        } else if(Array.isArray(hamsterFood[key]) && typeof ArrayBuffer !== 'undefined') {
          buffers.push(new ArrayBuffer(hamsterFood[key]));
        }
      }
    }
    return buffers;
  };

  self.onmessage = function(e) {
    self.params = e.data;
    self.rtn = {
      data: [],
      dataType: params.dataType ? params.dataType.toLowerCase() : null
    };
    let fn = new Function(params.fn);
    if (fn) {
      fn();
    }
    if (params.dataType) {
      rtn.data = self.typedArrayFromBuffer(rtn.dataType, rtn.data);
    }
    postMessage(rtn, self.prepareTransferBuffers(rtn));
  };
})();