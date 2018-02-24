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

    // this.persistence = true;
    // this.memoize = false;
    // this.atomics = false;
    // this.debug = false;
    // this.version = hamstersVersion;
    // this.maxThreads = hamstersHabitat.logicalThreads;
    // this.habitat = hamstersHabitat;
    // this.data = hamstersData;
    // this.pool = hamstersPool;
    // this.logger = hamstersLogger;
    // this.memoizer = hamstersMemoizer;
    // this.run = this.hamstersRun;
    // this.promise = this.hamstersPromise;
    // this.init = this.initializeLibrary;

describe("Hamsters.js", () => {

  it("Persistence should be boolean", () => {
    expect(hamsters.persistence).toMatch(/true|false/);
  });

  it("Memoize should be boolean", () => {
    expect(hamsters.memoize).toMatch(/true|false/);
  });

  it("Atomics should be boolean", () => {
    expect(hamsters.atomics).toMatch(/true|false/);
  });

  it("Debug should be boolean", () => {
    expect(hamsters.debug).toMatch(/true|false/);
  });

  it("maxThreads should be detected", () => {
    expect(hamsters.maxThreads).toEqual((navigator.hardwareConcurrency || 4));
  });

  it("Init should initialize library", () => {
    hamsters.init({
      maxThreads: 2
    });
    expect(typeof hamsters.init).toBe('undefined');
    expect(hamsters.maxThreads).toEqual(2);
  });
});