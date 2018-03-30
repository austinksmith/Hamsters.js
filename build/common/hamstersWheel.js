/* jshint esversion: 5, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

(function () {

   'use strict';

    if(typeof self === 'undefined') {
      var self = (global || window || this);
    }

    self.params = {};
    self.rtn = {};

    function prepareReturn(returnObject) {
      var dataType = returnObject.dataType;
      if(dataType) {
        returnObject.data = typedArrayFromBuffer(dataType, returnObject.data);
      }
      return returnObject;
    }

    function typedArrayFromBuffer(dataType, buffer) {
      var types = {
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
    }

    function prepareTransferBuffers(hamsterFood) {
      var buffers = [];
      var key = null;
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
    }

    onmessage = function(incomingMessage) {
      params = incomingMessage.data;
      rtn = {
        data: [],
        dataType: (params.dataType ? params.dataType.toLowerCase() : null),
        threadStart: Date.now()
      };
      if(params.importScripts) {
        self.importScripts(params.importScripts);
      }
      new Function(params.hamstersJob)();
      rtn.threadEnd = Date.now();
      postMessage(prepareReturn(rtn), prepareTransferBuffers(rtn));
    };

}());
