# Hamsters.js

**Author**: Austin K. Smith

**Website**: [Hamsters.io](www.hamsters.io)

**Description**: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers

**License**: Artistic License 2.0

# Getting Started

Obtain a copy of the library by using one of the options below, 

**HTML**

1. Download a copy of the latest relase version, or clone the repo locally
2. Upload the contents of the `src` directory to your server and add the script to your project as described below

```html
<!-- HTML4 and (x)HTML -->
<script type="text/javascript" src="path/to/hamsters.js">

<!-- HTML5 -->
<script src="path/to/hamsters.js"></script>
```
**React Native**

1. Download a copy of the latest relase version, or clone the repo locally
2. Add the contents of the `src` directory to your project and import the library like below
```js
 import hamsters from 'path/to/hamsters';
```
 
**Node.js**

1. Use npm to install hamsters.js `npm install --save hamsters.js`
2. Import the library into your `app.js` file like below

```js
var hamsters = require('hamsters.js');
```

Alternatively you can use bower or normal npm to install the library in other environments though support is not guaranteed, submit a ticket if you encounter problems.

**Bower**
```js
bower install WebHamsters
```
**NPM**
```js
npm install hamsters.js

```

Once you've downloaded and added the library to your project you should have a variable named hamsters available, this variable is the core of the library. Do not create any globally scoped variables with the same name or you will risk causing compatibility issues. Now that you've succesfully added the library to your project, let's get started below.


# How it works

Hamsters.js attempts to mimic exactly how you would write traditional functions in JavaScript in order to make threading your functions feel as natural as possible to your traditional workflow. The library is traditionally invoked by calling a function named `hamsters.run` this function takes several arguments that are paramount to making multithreading easy on you. These arguments are described below and will be important to understnad moving forward.

```js
hamsters.run(object, function, function, integer, boolean, string, boolean, string);
```

1. This required argument is our parameters object, this object is going to contain everything we want accessbile within our execution context. Since threads are sandboxed environments we cannot share scope with the main thread, it's important we add everything we need.

2. This required argument is going to be the function we want executed within our thread, any logic contained here will be sent to an available thread and executed there. It's important to note that in order to make things as simple as possible, the parameters object you passed previously can be accessed within this function from a internal `params` variable like so `var foo = params.bar;`.

3. This required argument is going to be our callback function which will return our final output from the previous function, this function takes only one argument which is simply your result and can be accessed like so `var result = arguments[0];`.

4. This optional argument will tell the library how many threads to execute the function declared previously across, this allows on a very easy level to change how many threads you are executing across. If you do not supply a value here the library defaults to a value of `1`.

5. This optional argument will tell the library wether or not we want to aggregate our individual thread outputs together after execution, this is only relevant if you are executing across multiple threads and defaults to `false`.

6. This optional argument will inform the library that our data array is one of javascripts [Typed Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays), when making use of this argument the library can make use of transferrable objects which can provide a dramatic performance improvement compared to serialization. This value is `null` by default and should only be used when needed.

7. This optional argument is intended to be used in conjuction with [memoization mode](#memoization), when memoization mode is enabled this argument allows one to control on an individual function level wether or not the results from that function are cached, this has a default value of `false`.

8. This optional argument will tell the library to automatically sort our final output either alphabetically or numerically, this argument has a default value of `null` and can be configured using the [sorting options](#sorting).

# Restructuring standard functions

Imagine we have a sequential function that loops through several items and performs operations on them, traditionally this would be written like below.

```js
function() {
  var array = [0,1,2,3,4,5,6,7,8,9];
  var output = new Array(array.length);
  array.forEach(function(item) {
    output.push((item * 120)/10);
  });
  return output;
}

```

Now we can put this task onto its own thread like so

```js
//1 thread and do not aggregate thread results (only one thread output)
function() {
  var params = {
    'array':[0,1,2,3,4,5,6,7,8,9]
  };
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

Alternatively we can split this task among 2 threads for paralell execution like so

```js
//2 threads and let's aggregate our individual thread results into one final output
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 2, true);
}

```
We can even define a function to split across all available threads like so

```js
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

# Tools

The library provides a few useful tools for doing everyday javascript actions in a background thread these should make threading implementations easier.

For example you can easily parse a json string in a background thread like so

```js
hamsters.tools.parseJson(string, function(json) {
 //do something with output
});
```
Additionally can easily stringify a json object in a background thread like so

```js
hamsters.tools.stringifyJson(json, function(string) {
 //do something with output
});
```
However the most powerful abstraction is the for loop abstraction, makes use of [Arguments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/arguments)

```js
var op = function(i) { //Perform this function on every element
  return arguments[0] * 2;
};
var options = {
  operator: op, //Operation to perform on every element
  array: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20], //Input array 
  startIndex: 0, //Optional Starting index for loop default of 0
  limit: null, //Optional Loop limit, eg. 4 to only compute elements 0-3 default of input array length
  dataType: 'Int32', //Optional dataType param default null
  incrementBy: 1, //Optional Increment amount per loop default of 1
  threads: 1 //Optional number of threads to execute across for parallel computing default of 1
};
hamsters.tools.loop(options, function(output) {
  console.log(output);
});
```

# Transferrable Objects

To obtain the best performance possible version 2.0 supports an optional dataType param, if your problem supports being transformed into any of javascripts typed arrays you can see up to 10x the performance boost over previous releases. 

If you do not know what typed arrays are please take a look at this guide [Typed Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays)

You may write a function to make use of these like so

```js
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

Where dataType is one of the below options.

* `Int8`
* `Int16`
* `Int32`
* `Uint8` 
* `Uint8Clamped` 
* `Uint16`
* `Uint32`
* `Float32` 
* `Float64`


# Memoization

Memoization introduced in versions `v2.2` is an optional operating mode for the library as well as an optional parameter for individual functions. In the event that you know you will be performing the same calculation over and over, then making use of memoization can dramatically reduce the cpu cycles your application consumes as after the first computation future requests for the same function with matching input will return the result from cache. 

The implementation on this has changed several times, in general verions between `v2.2` and `v3.9.7` made use of sessionStorage and were limited to roughly 5MB of cache depending on the browser used. In versions `v3.9.8` and later this is implemented as an in memory cache and is only limited by how much memory can be allocated to the library. 
 

In order to enable memoization mode you should set `hamsters.cache` to true, like below.

```js
hamsters.cache = true;
```

In order to enable caching for individual functions you must have the optional caching parameter set to true.

```js
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 2, true, Int32, true);
}
```


# Sorting
 
 Sorting introducted in version 2.7 is an optional parameter which allows for automatic sorting of your data contained within the`rtn.data` array.

 1. Numerical Sorting
    * `asc`
    * `desc`
 2. Alphabetical Sorting
    * `ascAlpha`
    * `descAlpha`

```js
function() {
  var params = {'array':[0,1,2,3,4,5,6,7,8,9]};
  hamsters.run(params, function() {
      var arr = params.array;
      arr.forEach(function(item) {
        rtn.data.push((item * 120)/10);
      });
  }, function(output) {
     return output;
  }, 2, true, 'Int32', true, 'ascAlpha');
}

```

# Persistence

Persistence introducted in version 3.3 is an optional operating mode for the libray which is enabled by default and can dramatically reduce runtime latency at the cost of somewhat higher heap allocation. When enabled the library will spawn all threads on initialization and will reuse the threads. When this option is disabled the library will instead spawn threads when needed and will destroy threads when they've completed execution. It is recommended you keep this enabled unless you are developing for memory constrained systems or do not require real time performance.

```js
hamsters.persistance = false;
```

# Debugging

The library supports two modes of debugging each provide useful information which may assist in fine tune performance & output tuning
You can invoke debug mode by setting hamsters.debug to true or 'verbose'. Verbose mode provides quite a large amount of console spam and should not be used unless you have a deep understanding of how the library runtime functions. Normal debug mode is useful for performance profling, verbose mode however will introduce it's own slight performance drawbacks. 

# Performance Considerations

Not every task can be easily paralellized and depending on the size of the task putting it onto its own thread may introduce its own performance drawbacks as any benefit may be outweighed by the overhead of the runtime itself. I highly recommend especially for a larger scale application that you spend some time learning about [Amdahls Law](http://en.wikipedia.org/wiki/Amdahl%27s_law)

Alternatively if your problem size scales with the amount of threads you use, you can see some serious performance gains. This is known as Gustafson's Law you can read more about this at [Gustafson's Law](http://en.wikipedia.org/wiki/Gustafson%27s_law). Also be sure to check out this performance example demonstrating the performance boost additional threads can have. 

[Perf Example](www.hamsters.io/performance)

The library attempts to detect the number of available cores on a client machine and formulates a maximum concurrent thread count based on that value, if the library is unable to detect a valid core count it will fallback to a maxThread count of 4. The library will automatically pool and manage execution across all available threads automatically scaling based on demand, and will destroy threads when they do not have pending work to complete, otherwise explicit threads are reused. 

Threads are not the same as cores, assuming your machine has 4 logical cores you can ask the library to split a given task across exactly 4 threads, however there is no guarantee that a single thread will have access to it's own core for execution. The operating system manages thread allocation to individual cores, Hamsters.js simply manages splitting sequential task across individual threads the library cannot control how the OS manages those threads once they are handed off. 

# Limitations

Currently due to a bug in how javascript handles data aggregation if you wish to have your individual thread outputs aggregated into a final result the maximum number of threads any single function can invoke is 20, there is no limitation on thread count if you are not asking for the library to aggregate your individual thread outputs back together.

Coincidentally FireFox enforces a per origin thread limit of 20, therefore on systems with greater than 20 logical cores maxThreads will be limited to 20 when using FireFox. Functions invoking greater than 20 threads will have threads pooled until execution is complete.

# Environment Support

* All major browsers IE9+
* Inside of existing web workers (threads inside threads)
* Javascript shell environments
* React Native
* Node.js
