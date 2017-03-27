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
	};

	hamstersBenchmark.generateOptions = function() {
		hamstersBenchmark.newArray(function() {
			var taskOptions = {
				operator: function(i) {
					return Math.sqrt(arguments[0]);
				},
				array: hamstersBenchmark.testArray,
				startIndex: 0,
				limit: null,
				dataType: "Int32",
				incrementBy: 1,
				threads: 1
			};
			var i = 0;
			var testOptions;
			for(i; i < hamsters.maxThreads; i += 1) {
				testOptions = Object.create(taskOptions);
				testOptions.threads = (i + 1);
				hamstersBenchmark.tests.push(testOptions);
			}
			hamstersBenchmark.getBaseline();
		});
	};

	hamstersBenchmark.runTask = function(options) {
		var forName = options.threads += "_for";
		var forStart = forName += "_start";
		var forEnd = forName += "_end";
		window.performance.mark(forStart);
		hamsters.tools.loop(options, function(result) {
			window.performance.mark(forEnd);
			window.performance.measure(forName, forStart, forEnd);
			if(hamstersBenchmark.tests.length !== 0) {
				console.log("NEXT!");
				hamstersBenchmark.runTask(hamstersBenchmark.tests.shift());
			} else {
				console.log("DONE!");
				hamstersBenchmark.complete();
			}
		});
 	};

	hamstersBenchmark.getBaseline = function() {
		window.performance.mark("sequential_for_start");
		var rtn = {
			data: []
		};
		var i = 0;
		for(i; i < hamstersBenchmark.testArray.length; i += 1) {
			rtn.data.push(Math.sqrt(hamstersBenchmark.testArray[i]));
		}
		window.performance.mark("sequential_for_end");
		window.performance.measure("sequential_for", "sequential_for_start", "sequential_for_end");
		hamstersBenchmark.runTask(hamstersBenchmark.tests.shift());
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
			hamstersBenchmark.testArray = output[0];
			callback();
		});
	};

	hamstersBenchmark.init();
}());