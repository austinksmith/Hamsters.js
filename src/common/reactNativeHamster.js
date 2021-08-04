/* jshint esversion: 5, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import { self } from 'react-native-hamsters';

(function () {
    self.params = {};
    self.rtn = {};

    self.onmessage = (message) => {
      params = JSON.parse(incomingMessage.data);
      rtn = {
        data: [],
        dataType: (params.dataType ? params.dataType.toLowerCase() : null)
      };
      eval(params.hamstersJob);
      return returnResponse(rtn);
    };

    const returnResponse = (rtn) => {
      return postMessage(JSON.stringify(rtn));
    }

    const typedArrayFromBuffer = (dataType, buffer) => {
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

    const prepareTransferBuffers = (rtn, buffers) => {
      Object.keys(rtn).forEach(function(key) {
        var item = rtn[key];
        if(typeof item.buffer !== 'undefined') {
          buffers.push(item.buffer);
        } else {
          if(Array.isArray(rtn[key]) && typeof ArrayBuffer !== 'undefined') {
            buffers.push(new ArrayBuffer(rtn[key]));
          }
        }
      });
      return postMessage(rtn, buffers);
    }
}());