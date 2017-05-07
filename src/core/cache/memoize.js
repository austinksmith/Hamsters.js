

module.exports = () => {
	"use strict";

	return {
		store: new Object({

		}),
		checkCache: (fn, input, dataType) => {
	    let cachedResult = this.store[fn];
	    if(cachedResult) {
	      if(cachedResult[0] === input && cachedResult[2] === dataType) {
	        return cachedResult;
	      }
	    }
	  },
	  memoize: (fn, inputArray, output, dataType) => {
	    this.store[fn] = [inputArray, output, dataType];
	  }
	};
};