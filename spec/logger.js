/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersLogger from '../src/core/logger';

describe("Hamsters Logger", () => {

  it("LogBook Should be an object", () => {
    expect(typeof hamstersLogger.logBook).toEqual('object');
  });

  it("LogBook Errors Should be an array", () => {
    expect(hamstersLogger.logBook.error).toEqual([]);
  });

  it("LogBook Info Should be an array", () => {
    expect(hamstersLogger.logBook.info).toEqual([]);
  });

  it("LogBook Warning Should be an array", () => {
    expect(hamstersLogger.logBook.warning).toEqual([]);
  });

});