/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersHabitat from '../src/core/habitat';

describe("Hamsters Habitat", () => {

  it("Habitat Node should be boolean", () => {
    expect(hamstersHabitat['node']).toMatch(/true|false/);
  });
  
  it("Habitat Browser should be boolean", () => {
    expect(hamstersHabitat['browser']).toMatch(/true|false/);
  });
  
  it("Habitat Atomics should be boolean", () => {
    expect(hamstersHabitat['atomics']).toMatch(/true|false/);
  });

  it("Habitat Legacy should be boolean", () => {
    expect(hamstersHabitat['legacy']).toMatch(/true|false/);
  });

  it("Habitat WebWorker should be boolean", () => {
    expect(hamstersHabitat['webWorker']).toMatch(/true|false/);
  });

  it("Habitat SharedWorker should be an object or function", () => {
    const options = ['object', 'function'];
    expect(options.indexOf(typeof hamstersHabitat['Worker'])).not.toBe(-1);
  });

  it("Habitat Worker should be an object or function", () => {
    const options = ['object', 'function'];
    expect(options.indexOf(typeof hamstersHabitat['sharedWorker'])).not.toBe(-1);
  });

  it("Habitat Shell should be boolean", () => {
    expect(hamstersHabitat['shell']).toMatch(/true|false/);
  });
  
  it("Habitat Atomics should be boolean", () => {
    expect(hamstersHabitat['transferrable']).toMatch(/true|false/);
  });

  it("Habitat Proxies should be boolean", () => {
    expect(hamstersHabitat['proxies']).toMatch(/true|false/);
  });

  it("Habitat Logical Threads should be detected", () => {
    expect(hamstersHabitat['logicalThreads']).not.toBe(null);
  });

});