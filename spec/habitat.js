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

hamsters.init({
  maxThreads: 1,
  persistence: false,
  cache: false
});

describe("Hamsters Habitat", () => {

  it("Habitat Node Should be boolean", () => {
    expect(hamsters.habitat['node']).toMatch(/true|false/);
  });
  
  it("Habitat Browser Should be boolean", () => {
    expect(hamsters.habitat['browser']).toMatch(/true|false/);
  });
  
  it("Habitat Atomics Should be boolean", () => {
    expect(hamsters.habitat['atomics']).toMatch(/true|false/);
  });

  it("Habitat Legacy Should be boolean", () => {
    expect(hamsters.habitat['legacy']).toMatch(/true|false/);
  });

  it("Habitat WebWorker Should be boolean", () => {
    expect(hamsters.habitat['webWorker']).toMatch(/true|false/);
  });

  it("Habitat Shell Should be boolean", () => {
    expect(hamsters.habitat['shell']).toMatch(/true|false/);
  });
  
  it("Habitat Atomics Should be boolean", () => {
    expect(hamsters.habitat['transferrable']).toMatch(/true|false/);
  });

  it("Habitat Proxies Should be boolean", () => {
    expect(hamsters.habitat['proxies']).toMatch(/true|false/);
  });
});