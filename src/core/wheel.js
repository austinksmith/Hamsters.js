/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersData from './data';
import hamstersHabitat from './habitat';

'use strict';

class wheel {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.worker = this.workerScaffold;
    this.regular = this.regularScaffold;
    this.legacy = this.legacyScaffold;
  }

  /**
  * @function workerScaffold - Provides worker body for library functionality when used within a worker [threads inside threads]
  */
  workerScaffold() {
    'use strict';

    if(typeof self === 'undefined') {
      self = (global || window || this);
    }

    self.params = {};
    self.rtn = {};

    addEventListener('connect', (incomingConnection) => {
      const port = incomingConnection.ports[0];
      port.start();
      port.addEventListener('message', (incomingMessage) => {
        params = incomingMessage.data;
        rtn = {
          data: [],
          dataType: params.dataType,
          threadStart: Date.now()
        };
        if(params.importScripts) {
          self.importScripts(params.importScripts);
        }
        eval("(" + params.hamstersJob + ")")();
        rtn.threadEnd = Date.now();
        port.postMessage(rtn);
      }, false);
    }, false);
  }

  /**
  * @function workerScaffold - Provides worker body for library functionality
  */
  regularScaffold() {
    'use strict';

    if(typeof self === 'undefined') {
      let self = (global || window || this);
    }

    self.params = {};
    self.rtn = {};

    function prepareReturn(returnObject) {
      let dataType = returnObject.dataType;
      if(dataType) {
        returnObject.data = typedArrayFromBuffer(dataType, returnObject.data);
      }
      return returnObject;
    }

    function typedArrayFromBuffer(dataType, buffer) {
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
    }

    function prepareTransferBuffers(hamsterFood) {
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
    }

    addEventListener('message', (incomingMessage) => {
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
    });
  }

  /**
  * @function legacyScaffold - Provides library functionality for legacy devices
  */
  legacyScaffold(params, resolve) {
    setTimeout(() => {
      // Node.js doesn't support self for some reason, so let's use global instead
      // this works great for node, not so great for reactNative
      // IOS has a secury check within React Native preventing global variable assignment
      // Android does not have the same security restriction
      if(typeof self === 'undefined') {
        var self = (global || window || this);
      }

      self.params = params;
      self.rtn = {
        data: [],
        threadStart: Date.now()
      };
      params.hamstersJob();
      rtn.threadEnd = Date.now();
      resolve(rtn);
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  }
};

var hamstersWheel = new wheel();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersWheel;
}
