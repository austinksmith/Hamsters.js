describe("WebHamsters Core Functionality", function() {

  for(var key in hamsters.wheel.env) {
    it("Hamsters.wheel.env."+key+" should be boolean", function() {
      expect(hamsters.wheel.env[key]).toMatch(/true|false/);
    });
  }

  it("Hamsters.tools.aggregate should aggregate array of subarrays", function() {
    expect(hamsters.tools.aggregate([[1],[2]])).toEqual([1,2]);
  });

  it("Hamsters.tools.splitArray should split array into subarrays", function() {
    expect(hamsters.tools.splitArray([1,2], 2)).toEqual([[1],[2]]);
  });

  it("Hamsters.wheel.newTask should create new task", function() {
    var task = hamsters.wheel.newTask(0, 1, null, 'int32', "rtn.data.push(params.array)", null);
    expect(hamsters.wheel.tasks[task.id]).not.toBeNull();
  });

  it("Hamsters.wheel.trackInput should track thread input", function() {
    var task = hamsters.wheel.newTask(0, 1, null, 'int32', "rtn.data.push(params.array)", null);
    var input = hamsters.wheel.trackInput([], 1, hamsters.wheel.tasks[0], {num: 32});
    expect(hamsters.wheel.tasks[task.id].input).not.toBeNull();
  });

  describe("WebHamsters running asynchronously", function() {
    beforeEach(function(done) {
      done();
    });
    var dataTypes = ['Int8','Int16','Int32','Float32','Float64','Uint16','Uint32','Uint8'];
    for (var i = dataTypes.length - 1; i >= 0; i--) {
      it("Computes 7th Fibonacci Number ("+dataTypes[i]+")", function(done) {
        hamsters.run({num: 7}, function() {
          var fib = function(n) {
            if (n < 2){
              return 1;
            } else {
              return fib(n-2) + fib(n-1);
            }
          }
          rtn.data.push(fib(params.num-1));
        }, function(res) {
          result = res[0];
          expect(result).toEqual(13);
          done();
        }, 1, true, dataTypes[i]);
      });
    }

    for (var i = dataTypes.length - 1; i >= 0; i--) {
      it("Calculates square root of 4000 ("+dataTypes[i]+")", function(done) {
        hamsters.run({num: 4000}, function() {
          rtn.data.push(Math.floor(Math.sqrt(params.num)));
        }, function(res) {
          result = res[0];
          expect(result).toEqual(63);
          done();
        }, 1, true, dataTypes[i]);
      });
    }

    it("Hamsters.tools.loop should abstract for loop usage", function(done) {
      var op = function(i) {
        return i * 2;
      };
      hamsters.tools.loop({
        operator: op,
        array: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
        startIndex: 0,
        dataType: 'Int32',
        incrementBy: 1,
        threads: 5
      }, function(output) {
        expect(output).toEqual(new Int32Array([2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40]));
        done();
      });
    });
  });
});
