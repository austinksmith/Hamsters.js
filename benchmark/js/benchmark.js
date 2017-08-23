var hamstersBenchmark = {
  delay: 300,
  tests: [],
  testArray: null
};

(function() {
  "use strict";

  hamstersBenchmark.init = function() {
    if(typeof window.performance === "undefined" || typeof window.performance.mark === "undefined") {
      alert("Your browser does not properly support the javascript performance API please use a different browser");
      return;
    }
    hamsters.init();
  };

  hamstersBenchmark.generateOptions = function() {
    var taskOptions = {
      operator: function(i) {
        return Math.sqrt(arguments[0]);
      },
      dataType: "Int32"
    };
    var i = 0;
    var testOptions;
    for(i; i < hamsters.maxThreads; i += 1) {
      testOptions = Object.create(taskOptions);
      testOptions.threads = (i + 1);
      hamstersBenchmark.tests.push(testOptions);
    }
    hamstersBenchmark.runTask(hamstersBenchmark.tests.shift());
  };

  hamstersBenchmark.addResultElements = function() {
    var results_table = document.getElementById("fancy_results_table");
    for (var i = 0; i < hamsters.maxThreads; i) {
      var row = results_table.insertRow(i + 1 );
      var thread = row.insertCell(0);
      var duration = row.insertCell(1);
      var improvement = row.insertCell(2);
      if(i == 0) {
        improvement.innerHTML = "Baseline";
      }
      improvement.className = ('difference_' + i);
      duration.className = ('duration_' + i); 
      thread.innerHTML = ((i += 1) + " Hamsters");
    }
  };

  hamstersBenchmark.runTask = function(options) {
    hamstersBenchmark.newArray(function(testArray) {
      options.array = new Int32Array(testArray);
      var forName = options.threads + "_for";
      var forStart = forName += "_start";
      var forEnd = forName += "_end";
      window.performance.mark(forStart);
      hamsters.tools.loop(options, function(result) {
        window.performance.mark(forEnd);
        window.performance.measure(forName, forStart, forEnd);
        if(hamstersBenchmark.tests.length !== 0) {
          hamstersBenchmark.runTask(hamstersBenchmark.tests.shift());
        } else {
          hamstersBenchmark.complete();
        }
      });
    });
  };

  hamstersBenchmark.getBaseline = function() {
    hamstersBenchmark.newArray(function(testArray) {
      window.performance.mark("sequential_for_start");
      var rtn = {
        data: []
      };
      var i = 0;
      for(i; i < testArray.length; i += 1) {
        rtn.data.push(Math.sqrt(testArray[i]));
      }
      window.performance.mark("sequential_for_end");
      window.performance.measure("sequential_for", "sequential_for_start", "sequential_for_end");
      hamstersBenchmark.runTask(hamstersBenchmark.tests.shift());
    });
  };

  hamstersBenchmark.run = function() {
    hamstersBenchmark.clearResults();
    document.getElementsByClassName("results")[0].style.display = "none";
    document.getElementById("center").style.display = "none";
    document.getElementsByClassName("progress")[0].style.display = "block";
    document.getElementsByClassName("progress-bar")[0].style.width = "100%";
    document.getElementsByClassName("status_text")[0].innerHTML = "Running...please wait.";
    hamstersBenchmark.generateOptions();
  };

  hamstersBenchmark.fetchResults = function() {
    return window.performance.getEntriesByType("measure");
  };

  hamstersBenchmark.clearResults = function() {
    window.performance.clearMarks();
    window.performance.clearMeasures();
  };

  hamstersBenchmark.complete = function() {
    document.getElementsByClassName("progress")[0].style.display = "none";
    document.getElementsByClassName("status_text")[0].innerHTML = "Benchmark complete!";
    var results = hamstersBenchmark.fetchResults();
    var baseline = results[0].duration;
    var i = results.length - 1;
    for (i; i >= 0; i--) {
      document.getElementsByClassName("duration_"+i)[0].innerHTML = results[i].duration;
      if(i === 0) {
        document.getElementsByClassName("difference_"+i)[0].innerHTML = "Baseline";
      } else {
        document.getElementsByClassName("difference_"+i)[0].innerHTML = (results[i].duration - baseline)/results[i].duration * -100 + "%";
      }
    }
    document.getElementsByClassName("results")[0].style.display = "block";
    document.getElementById("center").style.display = "block";
  };


  hamstersBenchmark.newArray = function(callback) {
    var testSize = Number(document.getElementsByClassName("test_size_select")[0].value);
    hamsters.tools.randomArray((testSize * 1000 * 1000), function(output) {
      callback(output[0]);
    });
  };

  hamstersBenchmark.init();
}());