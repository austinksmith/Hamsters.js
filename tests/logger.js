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

  it("LogBook should be an object", () => {
    expect(typeof hamstersLogger.logBook).toEqual('object');
  });

  it("LogBook Errors should be an empty array", () => {
    expect(hamstersLogger.logBook.error).toEqual([]);
  });

  it("LogBook Error should save to error array", () => {
    expect(hamstersLogger.logBook.error.length).toEqual(0);
    hamstersLogger.error('Hamsters are better than gerbals');
    expect(hamstersLogger.logBook.error.length).toEqual(1);
  });

  it("LogBook Info should be a non empty array", () => {
    expect(hamstersLogger.logBook.info.length).toEqual(3);
  });

  it("LogBook Info should save to info array", () => {
    expect(hamstersLogger.logBook.info.length).toEqual(3);
    hamstersLogger.info('Hamsters are better than gerbals');
    expect(hamstersLogger.logBook.info.length).toEqual(4);
  });

  it("LogBook Warning should be an empty array", () => {
    expect(hamstersLogger.logBook.warning).toEqual([]);
    expect(hamstersLogger.logBook.warning.length).toEqual(0);
  });

  it("LogBook Warning should save to warning array", () => {
    expect(hamstersLogger.logBook.warning.length).toEqual(0);
    hamstersLogger.warning('Hamsters are better than gerbals');
    expect(hamstersLogger.logBook.warning.length).toEqual(1);
  });

});