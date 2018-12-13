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

  it("randomArray should generate a random array", () => {
    hamstersData.randomArray(100, (randomArray) => {
      expect(Array.isArray(randomArray)).toBe(true);
      expect(randomArray.length).toEqual(100);
    });
  });

  it("locateBlobBuilder should return string", () => {
    let builder = hamstersData.locateBlobBuilder();
    expect(typeof builder).toBe('string');
  });

  it("prepareJob should convert function to string", () => {
    let preparedJob = hamstersData.prepareJob(() => {
      console.log('pay no attention to the hamster behind the curtain');
    });
    expect(typeof preparedJob).toEqual('string');
    expect(preparedJob.indexOf('console.log')).not.toBe(-1);
  });

  it("aggregateArrays should aggregate array of subarrays", () => {
    expect(hamstersData.aggregateArrays([[1],[2]])).toEqual([1,2]);
  });

  it("splitArrays should split array into subarrays", () => {
    expect(hamstersData.splitArrays([1,2], 2)).toEqual([[1],[2]]);
    expect(hamstersData.splitArrays([1,2, 3, 4], 4)).toEqual([[1],[2], [3], [4]]);
  });

  it("createBlob should create dataBlob", () => {
    let dataBlob = hamstersData.createBlob('hamsters just want to have fun');
    expect((typeof dataBlob)).toEqual('object');
  });

  it("generateBlob should generate blob with object url", () => {
    let dataBlobURI = hamstersData.generateWorkerBlob(() => {
      console.log('one hamster to rule them all');
    });
    expect(dataBlobURI).not.toEqual(null);
    expect(typeof dataBlobURI).toEqual('string');
  });

  it("processDataType should convert buffer into array", () => {
    let tempArray = new Int32Array(1, 2, 3, 4, 5, 6, 7, 8);
    let tempBuffer = tempArray.buffer;
    expect(typeof tempBuffer.reduce).toBe('undefined');
    let convertedArray = hamstersData.processDataType('int32', tempBuffer, true);
    expect(typeof convertedArray.reduce).toBe('function');
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