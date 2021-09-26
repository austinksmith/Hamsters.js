/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersData from '../src/core/data';

describe("Hamsters Data", () => {

  it("prepareFunction should convert function to string", () => {
    let preparedJob = hamstersData.prepareFunction(() => {
      console.log('All your cores are belong to me');
    });
    expect(typeof preparedJob).toEqual('string');
    expect(preparedJob.indexOf('console.log')).not.toBe(-1);
  });

  describe("sortOutput options", () => {
    let sortOptions = ['asc', 'desc', 'ascAlpha', 'descAlpha'];
    let numberArray = [1, 2, 3, 4];
    let stringArray = ['One', 'Two', 'Three', 'Four'];
    let i = 0;
    let sorted = null;
    let selection = null;
    for (i; i < sortOptions.length; i++) {
      if(sortOptions[i].indexOf('Alpha') !== -1) {
        sorted = hamstersData.sortOutput(new Array(stringArray), sortOptions[i]);
        selection = stringArray;
      } else {
        sorted = hamstersData.sortOutput(new Array(numberArray), sortOptions[i]);
        selection = numberArray;
      }
      it("sortOutput " + sortOptions[i] + " should sort array", () => {
        expect(sorted).not.toEqual(selection);
      });
    }
  });

});