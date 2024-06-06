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
        dataType: (typeof this.params.dataType !== 'undefined' ? this.params.dataType : null)
      };
      eval(this.params.hamstersJob);
      if(this.rtn.dataType) {
        this.rtn.data = typedArrayFromBuffer(this.rtn.dataType, this.rtn.data);
      }
      returnResponse(this.rtn);
    }.bind(this);

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

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = Wheel;
}
