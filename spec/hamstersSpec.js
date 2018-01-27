/*
* Title: this.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

import hamsters from '../src/hamsters';


hamsters.init({
  maxThreads: 1,
  persistence: false,
  cache: false
});

describe("Hamsters Core Functionality", function() {
  for(var key in hamsters.habitat) {
    if(hamsters.habitat.hasOwnProperty(key)) {
      it("Hamsters.habitat."+key+" should be boolean", function() {
        expect(hamsters.habitat[key]).toMatch(/true|false/);
      });
    }
  }

  it("Hamsters.tools.aggregate should aggregate array of subarrays", function() {
    expect(hamsters.tools.aggregateArrays([[1],[2]])).toEqual([1,2]);
  });

  it("Hamsters.tools.splitArray should split array into subarrays", function() {
    expect(hamsters.tools.splitArrays([1,2], 2)).toEqual([[1],[2]]);
  });

});

describe("Hamsters running asynchronously", function() {
  beforeEach(function(done) {
    done();
  });
  var dataTypes = ['Int8','Int16','Int32','Float32','Float64','Uint16','Uint32','Uint8', null];
  for (var i = dataTypes.length - 1; i >= 0; i--) {
    it("Computes 8th Fibonacci Number ("+dataTypes[i]+")", function(done) {
      hamsters.run({num: 7}, function() {
        var fib = function(n) {
          if (n < 2) {
            return 1;
          } else {
            return fib(n-2) + fib(n-1);
          }
        }
        rtn.data.push(fib(params.num-1));
      }, function(res) {
        var result = res[0];
        expect(result).toEqual(13);
        done();
      }, 1, true, dataTypes[i], true);
    });
  }

  for (var i = dataTypes.length - 1; i >= 0; i--) {
    it("Calculates square root of 4000 ("+dataTypes[i]+")", function(done) {
      hamsters.run({num: 4000}, function() {
        rtn.data.push(Math.floor(Math.sqrt(params.num)));
      }, function(res) {
        var result = res[0];
        expect(result).toEqual(63);
        done();
      }, 1, true, dataTypes[i], true);
    });
  }

  it("Should stringify json to string", function(done) {
    var json = {test: 1};
    hamsters.stringifyJson(json, function(string) {
      expect(typeof string).toEqual('string');
      done();
    });
  });

  it("Should parse string to json", function(done) {
    var string = '{"test": 1}';
    hamsters.parseJson(string, function(json) {
      expect(typeof json).toEqual('object');
      done();
    });
  });

  it("Hamsters.loop should abstract for loop usage", function(done) {
    var op = function(i) {
      return arguments[0] * 2;
    };
    hamsters.loop({
      operator: op,
      array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
      startIndex: 0,
      dataType: 'Int32',
      incrementBy: 1,
      threads: 2
    }, function(output) {
      if(hamsters.habitat.transferrable) {
        expect(output).toEqual(new Int32Array([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]));
      } else {
        expect(output).toEqual([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]);
      }
      done();
    });
  });
});

