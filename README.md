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
        rtn.data.push((item * 120)/10)
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
        rtn.data.push((item * 120)/10)
      });
  }, function(output) {
     return output;
  }, 4, true);
}

```

# Debugging

The library supports two modes of debugging each provide useful information which may assist in fine tune performance & output tuning
You can invoke debug mode by setting hamsters.debug to true or 'verbose'. Verbose mode provides quite a large amount of console spam and should not be used unless you have a deep understanding of how the library runtime functions. Normal debug mode is useful for performance profling, verbose mode however will introduce it's own slight performance drawbacks. 

# Performance Considerations

Not every task can be easily paralellized and depending on the size of the task putting it onto its own thread may introduce its own performance drawbacks as any benefit may be outweighed by the overhead of the runtime itself. I highly recommend especially for a larger scale application that you spend some time learning about Amdahls Law http://en.wikipedia.org/wiki/Amdahl%27s_law . 

The library attempts to detect the number of available cores on a client machine and formulates a maximum concurrent thread count based on that value, if the library is unable to detect a valid core count it will fallback to a maxThread count of 16. The library will automatically pool and manage execution across all available threads automatically scaling based on demand, and will destroy threads when they do not have pending work to complete, otherwise explicit threads are reused.

Threads are not the same as cores, assuming your machine has 4 logical cores you can ask the library to split a given task across exactly 4 threads, however there is no guarantee that a single thread will have access to it's own core for execution. The operating system manages thread allocation to individual cores, WebHamsters simply manages splitting sequential task across individual threads the library cannot control how the OS manages those threads once they are handed off. 

# Limitations

Currently due to a bug in how javascript handles data aggregation if you wish to have your individual thread outputs aggregated into a final result the maximum number of threads any single function can invoke is 20, there is no limitation on thread count if you are not asking for the library to aggregate your individual thread outputs back together.

IE11 as of v1.1 is supported by using a graceful fallback for data transfering, however this will be limited per thread by the length that JSON encoding can support approx. 30~ million characters. This graceful fallback will introduce some performance drawbacks as structured cloning is not nearly as fast as transferable objects.

# Browser Support

Currently as of v1.4 all browsers are supported by the library, modern browsers such as Chrome, Safari, and Firefox have full web worker support and will give the best performance, Internet Explorer 11 has partial support and is supported with limitations on how quickly data can be passed between the main thread and worker threads. Older browsers such as IE10 and below are supported by using a legacy processor fallback, these computations will be run on the main thread however they still follow the library process of breaking a given task into individual pieces and executing each piece at a time.




