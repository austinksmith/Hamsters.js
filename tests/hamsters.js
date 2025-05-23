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

  if(hamsters && typeof hamsters.scaffold.shared.scaffold === 'undefined') {
    hamsters.init();
  }

  it("Init should be a function", () => {
    expect(typeof hamsters.init).toBe('function'); 
  });

  it("Version should be populated", () => {
    expect(typeof hamsters.version).toBe('string');
  });

  it("maxThreads should be detected and match logical thread count", () => {
  	var maxThreads = (typeof navigator.hardwareConcurrency !== 'undefined' ? navigator.hardwareConcurrency : 4);
    expect(hamsters.maxThreads).toEqual(maxThreads);
  });

  for (let i = 0; i < 8; i++) {
    it("hamstersRun should execute a function using callbacks", (done) => {
      const params = {
        array: [1, 2, 3, 4, 5, 6, 7, 8],
        threads: i + 1
      };
  
      hamsters.run(params, function () {
        for (let j = 0; j < params.array.length; j++) {
          rtn.data.push(params.array[j] * 2);
        }
      }, function (results) {
        expect(typeof results).toBe('object');
        expect(results[i]).toEqual(params.array[i] * 2);
        done();
      }, function (error) {
        console.error(error);
        done();
      });
    });
  
    it("hamstersPromise should execute a function using promises", (done) => {
      const params = {
        array: [1, 2, 3, 4, 5, 6, 7, 8],
        threads: i + 1,
      };
  
      hamsters.promise(params, function () {
        for (let j = 0; j < params.array.length; j++) {
          rtn.data.push(params.array[j] * 4);
        }
      }).then(function (results) {
        expect(typeof results).toBe('object');
        expect(results[i]).toEqual(params.array[i] * 4);
        done();
      }).catch(function (error) {
        console.error(error);
        done();
      });
    });
  }
  
});