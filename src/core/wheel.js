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
    this.worker;
    this.regular;
    this.legacy;
  }

  /**
  * @function workerScaffold - Provides worker body for library functionality when used within a worker [threads inside threads]
  */
  worker() {
    self.params = {};
    self.rtn = {};

    addEventListener('connect', (incomingConnection) => {
      var port = incomingConnection.ports[0];
      port.start();
      port.addEventListener('message', (incomingMessage) => {
        params = incomingMessage.data;
        rtn = {
          data: [],
          dataType: params.dataType
        };
        eval("(" + params.hamstersJob + ")")();
        port.postMessage(rtn);
      }, false);
    }, false);
  }

  /**
  * @function workerScaffold - Provides worker body for library functionality
  */
  regular() {
    self.params = {};
    self.rtn = {};
    self.onmessage = function(message) {
      params = message.data;
      rtn = {
        data: [],
        dataType: (typeof params.dataType !== 'undefined' ? params.dataType : null)
      };
      new Function(params.hamstersJob)();
      if(rtn.dataType) {
        rtn.data = typedArrayFromBuffer(rtn.dataType, rtn.data);
      }
      returnResponse(rtn);
    }

    var typedArrayFromBuffer = (dataType, buffer) => {
      var types = {
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

    var returnResponse = function(rtn, buffers) {
      if(typeof rtn.data.buffer !== 'undefined') {
        postMessage(rtn, [rtn.data.buffer]);
      } else {
        postMessage(rtn);
      }
    }
  }

  /**
  * @function legacyScaffold - Provides library functionality for legacy devices
  */
  legacy(hamstersHabitat, params, resolve, reject) {
    var rtn = {
      data: [],
      dataType: (typeof params.dataType !== "undefined" ? params.dataType : null)
    };
    if(hamstersHabitat.reactNative) {
      self.rtn = rtn;
    }
    if(hamstersHabitat.node || hamstersHabitat.isIE) {
      eval(params.hamstersJob);
    } else {
      params.hamstersJob();
    }
    resolve(rtn.data);
  }

};

var hamstersWheel = new wheel();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersWheel;
}
