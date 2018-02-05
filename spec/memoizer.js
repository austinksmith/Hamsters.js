/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersMemoizer from '../src/core/memoizer';

describe("Hamsters Memoizer", () => {

  it("cacheEntries should be an array", () => {
    expect(hamstersMemoizer.cacheEntries).toEqual([]);
  });

  it("maxCacheEntries should be set", () => {
    expect(hamstersMemoizer.maxCacheEntries).not.toBe(null);
  });

  it("itemCached should return boolean", () => {
    expect(hamstersMemoizer.itemCached({}, [])).toMatch(/true|false/);
  });

});