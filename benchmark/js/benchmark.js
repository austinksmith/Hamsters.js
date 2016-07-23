
var benchmark = {};

benchmark.run = function () {
    'use strict';
    var delay = 300;
    var fn = {};
    var dat = {
        testArray: null,
        runs: 1000000
    };

    fn.setup = function () {
        dat.testString = String();
    };

    fn.doSomething = function (i) {
        dat.testString += (String(i) * 5);
    };

    fn.maxThreadForReal = function (callback) {
        fn.setup();
        window.performance.mark('maxThread_for_start');
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            window.performance.mark('maxThread_for_end');
            window.performance.measure('maxThread_for', 'maxThread_for_start', 'maxThread_for_end');
            callback.call();
        }, hamsters.maxThreads, true, 'Int32');
    };

    fn.maxThreadFor = function (callback) {
        fn.setup();
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            callback.call();
        }, hamsters.maxThreads, true, 'Int32');
    };

    fn.sequentialFor = function (callback) {
        fn.setup();
        window.performance.mark('sequential_for_start');
        var rtn = {
          data: []
        };
        for (var i = 0; i < dat.testArray.length; i += 1) {
            rtn.data.push(Math.sqrt(dat.testArray[i]));
        }
        window.performance.mark('sequential_for_end');
        window.performance.measure('sequential_for', 'sequential_for_start', 'sequential_for_end');
        fn.singleThreadFor();
    };

    fn.singleThreadFor = function (callback) {
        fn.setup();
        window.performance.mark('singleThread_for_start');
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            window.performance.mark('singleThread_for_end');
            window.performance.measure('singleThread_for', 'singleThread_for_start', 'singleThread_for_end');
            fn.twoThreadFor();
        }, 1, true, 'Int32');
    };

    fn.twoThreadFor = function (callback) {
        fn.setup();
        window.performance.mark('twoThread_for_start');
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            window.performance.mark('twoThread_for_end');
            window.performance.measure('twoThread_for', 'twoThread_for_start', 'twoThread_for_end');
            fn.threeThreadFor();
        }, 2, true, 'Int32');
    };

    fn.threeThreadFor = function (callback) {
        fn.setup();
        window.performance.mark('threeThread_for_start');
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            window.performance.mark('threeThread_for_end');
            window.performance.measure('threeThread_for', 'threeThread_for_start', 'threeThread_for_end');
            fn.fourThreadFor();
        }, 3, true, 'Int32');
    };

    fn.fourThreadFor = function (callback) {
        fn.setup();
        window.performance.mark('fourThread_for_start');
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            window.performance.mark('fourThread_for_end');
            window.performance.measure('fourThread_for', 'fourThread_for_start', 'fourThread_for_end');
            if(hamsters.maxThreads >= 5) {
              fn.fiveThreadFor();
            } else {
              fn.complete();
            }
        }, 4, true, 'Int32');
    };

    fn.fiveThreadFor = function (callback) {
        fn.setup();
        window.performance.mark('fiveThread_for_start');
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            window.performance.mark('fiveThread_for_end');
            window.performance.measure('fiveThread_for', 'fiveThread_for_start', 'fiveThread_for_end');
            if(hamsters.maxThreads >= 6) {
              fn.sixThreadFor();
            } else {
              fn.complete();
            }
        }, 5, true, 'Int32');
    };

    fn.sixThreadFor = function (callback) {
        fn.setup();
        window.performance.mark('sixThread_for_start');
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            window.performance.mark('sixThread_for_end');
            window.performance.measure('sixThread_for', 'sixThread_for_start', 'sixThread_for_end');
            if(hamsters.maxThreads >= 7) {
              fn.sevenThreadFor();
            } else {
              fn.complete();
            }
        }, 6, true, 'Int32');
    };

    fn.sevenThreadFor = function (callback) {
        fn.setup();
        window.performance.mark('sevenThread_for_start');
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            window.performance.mark('sevenThread_for_end');
            window.performance.measure('sevenThread_for', 'sevenThread_for_start', 'sevenThread_for_end');
            if(hamsters.maxThreads >= 8) {
              fn.eightThreadFor();
            } else {
              fn.complete();
            }
        }, 7, true, 'Int32');
    };

    fn.eightThreadFor = function (callback) {
        fn.setup();
        window.performance.mark('eightThread_for_start');
        hamsters.run({'array': dat.testArray}, function() {
            for (var i = 0; i < params.array.length; i += 1) {
                rtn.data.push(Math.sqrt(params.array[i]));
            }
        }, function(output) {
            window.performance.mark('eightThread_for_end');
            window.performance.measure('eightThread_for', 'eightThread_for_start', 'eightThread_for_end');
            fn.complete();
        }, 8, true, 'Int32');
    };

    fn.getResults = function () {
        var results = window.performance.getEntriesByType('measure');
        window.performance.clearMarks();
        window.performance.clearMeasures();
        return results;
    };

    fn.complete = function() {
        document.getElementsByClassName("progress")[0].style.display = "none";
        document.getElementsByClassName("status_text")[0].innerHTML = "Benchmark complete!";                                                                                var results = fn.getResults();
        var baseline = results[0].duration;
        for (var i = results.length - 1; i >= 0; i--) {
            document.getElementsByClassName('duration_'+i)[0].innerHTML = results[i].duration;
            if(i === 0) {
                document.getElementsByClassName('difference_'+i)[0].innerHTML = 'Baseline';
            } else {
                document.getElementsByClassName('difference_'+i)[0].innerHTML = (results[i].duration - baseline)/results[i].duration * -100 + '%';
            }
        };
        document.getElementsByClassName('results')[0].style.display = "block";
        document.getElementById("center").style.display = "block";
    };

    fn.init = function () {
        document.getElementsByClassName('results')[0].style.display = "none";
        if(!window.performance || !window.performance.mark) {
            alert('Your browser does not properly support the javascript performance API please use a different browser');
            return;
        }
        document.getElementById("center").style.display = "none";
        document.getElementsByClassName("progress")[0].style.display = "block";
        document.getElementsByClassName("progress-bar")[0].style.width = "100%";
        document.getElementsByClassName("status_text")[0].innerHTML = "Running...please wait.";
        var testsize = Number(document.getElementsByClassName("test_size_select")[0].value);
        hamsters.tools.randomArray((testsize * 1000 * 1000), function(output) {
            dat.testArray = output[0];
            setTimeout(function() {
               fn.sequentialFor();
            }, 300);
        });
    };
    fn.init();
};