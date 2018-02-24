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
    expect(hamstersPool.tasks.length).toEqual(9);
  });

  it("Threads should be an array", () => {
    expect(hamstersPool.threads.length).toEqual(2);
  });

  it("Running should be an array", () => {
    expect(hamstersPool.running).toEqual([]);
  });

  it("Pending should be an array", () => {
    expect(hamstersPool.pending).toEqual([]);
  });

  it("selectHamsterWheel should return a function", () => {
    expect(typeof hamstersPool.selectHamsterWheel()).toEqual('function');
  });

});