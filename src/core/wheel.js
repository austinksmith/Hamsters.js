/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

/* jshint esversion: 6 */

import hamsterData from './core/data';
import hamsterHabitat from './core/habitat';


'use strict';

class wheel {

  constructor() {
    this.worker = this.workerScaffold;
    this.regular = this.regularScaffold;
    this.legacy = this.legacyScaffold;
  }

  workerScaffold() {
    self.addEventListener("connect", function(e) {
      const port = e.ports[0];
      port.start();
      port.addEventListener("message", function(e) {
        self.params = e.data;
        self.rtn = {
          data: [],
          dataType: params.dataType
        };
        let fn = eval("(" + params.fn + ")");
        if (fn) {
          fn();
        }
        port.postMessage({
          results: rtn
        });
      }, false);
    }, false);
  }

  regularScaffold() {
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
  }

  legacyScaffold(task, array, resolve, reject) {
    setTimeout(function() {
      var rtn = {
        success: true,
        data: []
      };
      var params = task.input;
      params.array = array;
      params.fn();
      if (params.dataType) {
        rtn.data = hamsterData.processDataType(params.dataType, rtn.data, hamsterHabitat.transferable);
        rtn.dataType = params.dataType;
      }
      resolve(rtn);
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  }
}

var hamsterWheel = new wheel();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterWheel;
}
