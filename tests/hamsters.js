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

  it("Init should initialize library", () => {
    hamsters.init();
    expect(typeof hamsters.init).toBe('function'); 
  });

  it("maxThreads should be detected and match logical thread count", () => {
  	var maxThreads = (typeof navigator.hardwareConcurrency !== 'undefined' ? navigator.hardwareConcurrency : 4);
    expect(hamsters.maxThreads).toEqual(maxThreads);
  });

});