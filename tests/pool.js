/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersPool from '../src/core/pool';

describe("Hamsters Pool", () => {

  it("Tasks should be an array", () => {
    expect(Array.isArray(hamstersPool.tasks)).toEqual(true);
  });

  it("Threads should be an array", () => {
    expect(Array.isArray(hamstersPool.threads)).toEqual(true);
  });

  it("Running should be an array", () => {
    expect(Array.isArray(hamstersPool.running)).toEqual(true);
  });

  it("Pending should be an array", () => {
    expect(Array.isArray(hamstersPool.pending)).toEqual(true);
  });

});