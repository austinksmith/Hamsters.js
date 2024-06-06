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

describe("Hamsters Wheel", () => {

  if(hamsters && typeof hamsters.wheel.worker === 'undefined') {
    hamsters.init();
  }

  let Wheel = hamsters.wheel;

  it("WebWorker scaffold should be a function", () => {
    expect((typeof Wheel.worker)).toEqual('function');
  });

  it("Regular scaffold should be a function", () => {
    expect((typeof Wheel.regular)).toEqual('function');
  });

  it("Legacy scaffold should be a function", () => {
    debugger;
    expect((typeof Wheel.legacy)).toEqual('function');
  });

});