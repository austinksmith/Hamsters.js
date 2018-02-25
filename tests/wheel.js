/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersWheel from '../src/core/wheel';

describe("Hamsters Wheel", () => {

  it("WebWorker scaffold should be a function", () => {
    expect((typeof hamstersWheel.worker)).toEqual('function');
  });

  it("Regular scaffold should be a function", () => {
    expect((typeof hamstersWheel.regular)).toEqual('function');
  });

  it("Legacy scaffold should be a function", () => {
    expect((typeof hamstersWheel.legacy)).toEqual('function');
  });

});