# WebHamsters
**Author**: Austin K. Smith

**Website**: http://www.hamsters.io

**Description**: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers

**License**: Artistic License 2.0


# Guides
Detailed Documentation coming soon check http://www.hamsters.io/guides for details

# Getting Started
The basic structure of a WebHamster function is as follows

```
// Params you want accessed by your function, for automatic task splitting your data array must have the index of 'array'
 var params = {'array':[]};  
  hamsters.run(params, function() {
      //Operations you wish to perform inside each thread
  }, function(output) {
     //Resulting output callback, do as you wish with your output
  }, 1 //Integer # of threads to invoke , true //Boolean aggregate individual thread outputs);

```

Inside of your function you have an rtn object available to pass your output into, your function must use this object to push your output into the rtn.data array so the library can manage the data dependencies between each thread efficiently. Failure to use the rtn.data array for your output may lead to unexpected behavior. You've been warned.

# Restructuring standard functions

Imagine we have a sequential function that loops through several items and performs operations on them, traditionally this would be written like below.

```
function() {
  var array = [0,1,2,3,4,5,6,7,8,9];
  var output = [];
  array.forEach(function(item) {
    output.push((item * 120)/10);
  });
  return output;
}

```

Now we can put this task onto its own thread like so

```
//1 thread and do not aggregate thread results (only one thread output)
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 1, false);
}

```

Alternatively we can split this task among 4 threads for paralell execution like so

```
//4 threads and let's aggregate our individual thread results into one final output
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 4, true);
}

```
We can even define a function to split across all available threads like so

Alternatively we can split this task among 4 threads for paralell execution like so

```
//All threads and let's aggregate our individual thread results into one final output
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, hamsters.maxThreads, true);
}

```

# Performance Tweaking

To obtain the best performance possible version 2.0 supports an optional dataType param, if your problem supports being transformed into any of javascripts typed arrays you can see up to 10x the performance boost over previous releases. 

If you do not know what typed arrays are please take a look at this guide https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays 

You may write a function to make use of these like so

```
//4 threads and use dataType and let's aggregate our individual thread results into one final output
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 4, true, dataType);
}

```

Where dataType is: 'Int8' || 'Int16' || 'Int32' || 'Uint8' || 'Uint8Clamped' || 'Uint16' || 'Uint32' || 'Float32' || 'Float64'


# Result Caching (Memoization)

To obtain the best performance possible version 2.2 supports an optional result caching option, if you know you will be performing the same calculation numerous times enabling cache mode can result in a big performance boost as it will pull the result from cache instead of recalculating the output. This cache mode makes use of session storage and is limited to roughly 5MB of space depending on the browser used. The library will attempt to cache as many previous runs as possible and will only clear out past results in the event that session storage is full. Not all outputs can be cached as they may be too large so this is disabled by default. However version 2.3 introduces hashing of the input values instead of storing both the input and output, this change roughly doubles the space for memoization making this much more viable. 
 

You may enable cache mode by setting

```
hamsters.cache = true;
```

You can disable caching for individual functions like so 

```
//All threads and let's aggregate our individual thread results into one final output, no memoization
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 4, true, dataType, false);
}
```


# Debugging

The library supports two modes of debugging each provide useful information which may assist in fine tune performance & output tuning
You can invoke debug mode by setting hamsters.debug to true or 'verbose'. Verbose mode provides quite a large amount of console spam and should not be used unless you have a deep understanding of how the library runtime functions. Normal debug mode is useful for performance profling, verbose mode however will introduce it's own slight performance drawbacks. 

# Performance Considerations

Not every task can be easily paralellized and depending on the size of the task putting it onto its own thread may introduce its own performance drawbacks as any benefit may be outweighed by the overhead of the runtime itself. I highly recommend especially for a larger scale application that you spend some time learning about Amdahls Law http://en.wikipedia.org/wiki/Amdahl%27s_law . Also be sure to check out this jspef example demonstrating the overhead that additional threads have, performance currently varies wildly between browsers. http://jsperf.com/javascript-multi-threading/3

The library attempts to detect the number of available cores on a client machine and formulates a maximum concurrent thread count based on that value, if the library is unable to detect a valid core count it will fallback to a maxThread count of 2. The library will automatically pool and manage execution across all available threads automatically scaling based on demand, and will destroy threads when they do not have pending work to complete, otherwise explicit threads are reused.

Threads are not the same as cores, assuming your machine has 4 logical cores you can ask the library to split a given task across exactly 4 threads, however there is no guarantee that a single thread will have access to it's own core for execution. The operating system manages thread allocation to individual cores, WebHamsters simply manages splitting sequential task across individual threads the library cannot control how the OS manages those threads once they are handed off. 

# Limitations

Currently due to a bug in how javascript handles data aggregation if you wish to have your individual thread outputs aggregated into a final result the maximum number of threads any single function can invoke is 20, there is no limitation on thread count if you are not asking for the library to aggregate your individual thread outputs back together.

IE11 as of v1.7 is fully supported however during testing IE11 will throw out of memory errors after spawning a large number of threads over and over, the library now attempts to free this memory however it appears not to resolve the issue therefore IE11 is not recommended for really heavy applications such as online games.

# Browser Support

Currently as of v1.4 all browsers are supported by the library, modern browsers such as Chrome, Safari, and Firefox have full web worker support and will give the best performance, Older browsers such as IE10 and below are supported by using a legacy processor fallback, these computations will be run on the main thread however they still follow the library process of breaking a given task into individual pieces and executing each piece at a time.





