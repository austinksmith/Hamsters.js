/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

(function() {
	function processDataType(dataType, buffer) {
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
	  if(!types[dataType]) {
	    return buffer;
	  }
	  return new types[dataType](buffer);
	}
	self.onmessage = function(e) {
	  self.params = e.data;
	  self.rtn = {
	    data: [],
	    dataType: self.params.dataType
	  };
	  var fn = new Function(self.params.fn);
	  if(fn) {
	    fn();
	  }
	  if(self.params.dataType) {
	    self.rtn.data = processDataType(self.params.dataType, self.rtn.data);
	    self.postMessage({
	      results: self.rtn
	    }, [rtn.data.buffer]);
	  } else {
	    self.postMessage({
	      results: self.rtn
	    });
	  }
	}
}());