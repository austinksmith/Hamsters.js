/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

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
      let port = incomingConnection.ports[0];
      port.start();
      port.addEventListener('message', (incomingMessage) => {
        params = incomingMessage.data;
        rtn = {
          data: [],
          dataType: params.dataType
        };
        if(params.importScripts) {
          self.importScripts(self.params.importScripts);
        }
        eval("(" + params.hamstersJob + ")")();
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

    /**
    * @function prepareTransferBuffers - Prepares transferrable buffers for faster message passing
    * @param {object} hamsterFood - Message to send to thread
    */
    function prepareTransferBuffers(hamsterFood) {
      let key, buffers = [];
      for(key in hamsterFood) {
        if(hamsterFood.hasOwnProperty(key)) {
          if(typeof hamsterFood[key].buffer !== 'undefined') {
            buffers.push(hamsterFood[key].buffer);
          }
        }
      }
      return buffers;
    }

    self.onmessage = function(incomingMessage) {
      params = incomingMessage.data;
      rtn = {
        data: [],
        dataType: (params.dataType ? params.dataType.toLowerCase() : null)
      };
      if(params.importScripts) {
        self.importScripts(params.importScripts);
      }
      new Function(params.hamstersJob)();
      rtn = prepareReturn(rtn);
      postMessage(rtn, prepareTransferBuffers(rtn));
    }
  }

  /**
  * @function legacyScaffold - Provides library functionality for legacy devices
  */
  legacyScaffold(params, resolve) {
    setTimeout(() => {
      if(typeof self === 'undefined') {
        let self = (global || window || this);
      }
      self.params = params;
      self.rtn = {
        data: []
      };
      params.hamstersJob();
      resolve(rtn);
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  }
};

var hamstersWheel = new wheel();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersWheel;
}
