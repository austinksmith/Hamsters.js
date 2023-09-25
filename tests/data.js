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

  it("getSubrrayIndexes should calculate array indexes", () => {
    const array = [1,2,3,4];
    const numberOfThreads = 2;
    const indexes = hamstersData.getSubArrayIndexes(array, numberOfThreads);
    const size = Math.ceil(array.length/numberOfThreads);
    for (let i = 0; i < numberOfThreads; i += size) {
      expect(indexes[i].start).toEqual(i);
      expect(indexes[i].end).toEqual(((i + size) - 1));
    }
  });

  it("getSubArrayFromIndex should return subarray using index", () => {
    const index = {start: 1, end: 3};
    const dataArray = [1,2,3,4];
    const task = {
      input: {
        array: dataArray
      }
    }
    const output = hamstersData.getSubArrayFromIndex(index, task);
    expect(output[0]).toEqual(2);
    expect(output[1]).toEqual(3);
    expect(output[2]).toEqual(4);
  });

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