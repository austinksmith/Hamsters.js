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

  it("determineGlobalThreads should return a number", () => {
    expect(typeof hamstersHabitat.determineGlobalThreads()).toBe("number");
  });

  it("isLegacyEnvironment should return false", () => {
    expect(hamstersHabitat.isLegacyEnvironment()).toEqual(false);
  });

  it("isLegacyDevice should return boolean", () => {
    expect(hamstersHabitat.isLegacyDevice()).toMatch(/true|false/);
  });

  it("supportsSharedWorkers should be boolean", () => {
    expect(hamstersHabitat.supportsSharedWorkers()).toMatch(/true|false/);
  });

  it("Logical Threads should be detected", () => {
    expect(hamstersHabitat['logicalThreads']).not.toBe(null);
    expect(hamstersHabitat['logicalThreads']).toEqual(4);
  });

  it("Persistence should be boolean", () => {
    expect(hamstersHabitat['persistence']).toMatch(/true|false/);
  });

  it("Memoize should be boolean", () => {
    expect(hamstersHabitat['memoize']).toMatch(/true|false/);
  });

  it("ImportScripts should be null", () => {
    expect(hamstersHabitat['importScripts']).toBe(null);
  });

  it("Debug should be boolean", () => {
    expect(hamstersHabitat['debug']).toMatch(/true|false/);
  });

  it("Node should be boolean", () => {
    expect(hamstersHabitat['node']).toMatch(/true|false/);
  });
  
  it("Browser should be boolean", () => {
    expect(hamstersHabitat['browser']).toMatch(/true|false/);
  });

  it("isIE10 should be boolean", () => {
    expect(hamstersHabitat['isIE10']).toMatch(/true|false/);
  });
  
  it("Atomics should be boolean", () => {
    expect(hamstersHabitat['atomics']).toMatch(/true|false/);
  });

  it("Legacy should be boolean", () => {
    expect(hamstersHabitat['legacy']).toMatch(/true|false/);
  });

  it("WebWorker should be boolean", () => {
    expect(hamstersHabitat['webWorker']).toMatch(/true|false/);
  });

  it("Shell should be boolean", () => {
    expect(hamstersHabitat['shell']).toMatch(/true|false/);
  });
  
  it("Transferrable should be boolean", () => {
    expect(hamstersHabitat['transferrable']).toMatch(/true|false/);
  });

  it("Proxies should be boolean", () => {
    expect(hamstersHabitat['proxies']).toMatch(/true|false/);
  });

  it("reactNative should be boolean", () => {
    expect(hamstersHabitat['reactNative']).toMatch(/true|false/);
  });

  it("LegacyWheel should be an object or function", () => {
    const options = ['object', 'function'];
    expect(hamstersHabitat['legacyWheel']).not.toBe(null);
    expect(options.indexOf(typeof hamstersHabitat['legacyWheel'])).not.toBe(-1);
  });
  
  it("Worker should be an object or function", () => {
    const options = ['object', 'function'];
    expect(hamstersHabitat['Worker']).not.toBe(null);
    expect(options.indexOf(typeof hamstersHabitat['Worker'])).not.toBe(-1);
  });

  it("SharedWorker should be an object or function", () => {
    const options = ['object', 'function'];
    expect(hamstersHabitat['sharedWorker']).not.toBe(null);
    expect(options.indexOf(typeof hamstersHabitat['sharedWorker'])).not.toBe(-1);
  });

  it("SelectHamsterWheel should be a function", () => {
    expect(typeof hamstersHabitat.selectHamsterWheel).toEqual('function');
  });

});