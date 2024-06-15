class Wheel {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor(hamsters) {
    'use strict';

    this.hamsters = hamsters;
    this.worker = this.workerScaffold;
    this.regular = this.regularScaffold;
    this.legacy = this.legacyScaffold.bind(this);
  }

  /**
  * @function workerScaffold - Provides worker body for library functionality when used within a worker [threads inside threads]
  */
  workerScaffold() {
    self.params = {};
    self.rtn = {};

    addEventListener('connect', (incomingConnection) => {
      var port = incomingConnection.ports[0];
      port.start();
      port.addEventListener('message', (incomingMessage) => {
        this.params = incomingMessage.data;
        this.rtn = {
          data: [],
          dataType: this.params.dataType
        };
        eval("(" + this.params.hamstersJob + ")")();
        port.postMessage(this.rtn);
      }, false);
    }, false);
  }

  /**
   * @function regularScaffold - Provides worker body for library functionality
   */
  regularScaffold() {
    self.params = {};
    self.rtn = {};

    self.onmessage = function(message) {
      this.params = message.data;
      this.rtn = {
        data: [],
        dataType: (typeof this.params.dataType !== 'undefined' ? this.params.dataType : null),
        index: this.params.index
      };
      if (this.params.sharedBuffer) {
        this.params.sharedArray = typedArrayFromBuffer(this.params.dataType, this.params.sharedBuffer);
      }
      eval(this.params.hamstersJob);
      const buffers = handleDataType(this.rtn);
      returnResponse(this.rtn, buffers);
    }.bind(this);

    function handleDataType(rtn) {
      if (this.params.sharedArray) {
        // Do nothing here, we don't need to return a buffer rtn.data is useless here
      } else {
        rtn.data = typedArrayFromBuffer(rtn.dataType, rtn.data);
      }
      return getTransferableObjects(rtn); // Return transferable objects
    }

    function typedArrayFromBuffer(dataType, buffer) {
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

    function returnResponse(rtn, buffers) {
      if (buffers && buffers.length > 0) {
        // If there are buffers, postMessage with transferable objects
        postMessage(rtn, buffers);
      } else {
        // Otherwise, postMessage without transferable objects
        postMessage(rtn);
      }
    }

    function getTransferableObjects(obj) {
      const typedArrayBuffers = [];
      const transferableObjects = [];
      const typedArrayTypes = [
        'Int32Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array', 
        'Uint16Array', 'Uint32Array', 'Float32Array', 'Float64Array'
      ];
      const otherTransferables = [
        'ArrayBuffer', 'MessagePort', 'ImageBitmap', 'OffscreenCanvas'
      ];

      const globalContext = typeof self !== 'undefined' ? self : window;

      for (const prop in obj) {
        for (const type of typedArrayTypes) {
          if (typeof globalContext[type] !== 'undefined' && obj[prop] instanceof globalContext[type]) {
            typedArrayBuffers.push(obj[prop].buffer);
            break;
          }
        }

        for (const type of otherTransferables) {
          if (typeof globalContext[type] !== 'undefined' && obj[prop] instanceof globalContext[type]) {
            transferableObjects.push(obj[prop]);
            break;
          }
        }
      }

      return typedArrayBuffers.concat(transferableObjects);
    }
  }


  /**
  * @function legacyScaffold - Provides library functionality for legacy devices
  */
  legacyScaffold(params, resolve, reject) {
    var rtn = {
      data: [],
      dataType: (typeof params.dataType !== "undefined" ? params.dataType : null)
    };
    if(this.hamsters.habitat.reactNative) {
      self.rtn = rtn;
    }
    if(this.hamsters.habitat.node || this.hamsters.habitat.isIE) {
      eval(params.hamstersJob);
    } else {
      params.hamstersJob();
    }
    resolve(rtn.data);
  }
}

module.exports = Wheel;
