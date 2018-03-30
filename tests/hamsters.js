/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamsters from '../src/hamsters';

describe("Hamsters.js", () => {

  it("maxThreads should be detected", () => {
    expect(hamsters.maxThreads).toEqual((navigator.hardwareConcurrency || 4));
  });

  it("Init should initialize library", () => {
    hamsters.init({
      maxThreads: 2,
      browser: true,
      reactNative: false
    });
    expect(typeof hamsters.init).toBe('undefined');
    expect(hamsters.maxThreads).toEqual(2);
  });
});

describe("WebHamsters running asynchronously", () => {
  
  beforeEach((done) => {
    done();
  });

  var dataTypes = ['Int8','Int16','Int32','Float32','Float64','Uint16','Uint32','Uint8', null];

  for (var i = dataTypes.length - 1; i >= 0; i--) {
    it("Calculates square root of 4000 ("+dataTypes[i]+")", function(done) {
      var params = {
        threads: 1,
        aggregate: true,
        dataType: dataTypes[i],
        num: 4000
      };
      hamsters.run(params, function() {
        rtn.data.push(Math.floor(Math.sqrt(params.num)));
      }, function(res) {
        console.log(res);
        console.log(res.data[0][0]);
        expect(res.data[0][0]).toEqual(63);
        done();
      });
    });
  }
});