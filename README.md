# Hamsters.js

**Author**: Austin K. Smith

**Website**: [Hamsters.io](https://www.hamsters.io)

**Description**: 100% Vanilla Javascript Multithreading & Parallel Execution Library

**License**: Artistic License 2.0

# Environment Support

* All major browsers IE9+
* Inside of existing web workers (threads inside threads)
* Javascript shell environments
* React Native
* Node.js

# Getting Started

Obtain a copy of the library by using one of the options below, 

**HTML**

1. Download a copy of the latest release version, or clone the repo locally
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

Once you've downloaded and added the library to your project you should have a variable named hamsters available, this variable is the core of the library. Do not create any globally scoped variables with the same name or you will risk causing compatibility issues. Now that you've successfully added the library to your project, let's get started below.

# Initializing the library

Starting in version 4.1.0 the library will no longer automatically initialize when your application loads, in order to allow for more fine tuned control over the library operation you can now pass an optional `startOptions` configuration object to control library behavior.

```js
  var startOptions = {
    maxThreads: integer,
    cache: boolean,
    debug: booealn,
    persistence: boolean
  };
  hamsters.init(startOptions);
```

At the moment only the above configuration options are available for your control, in later releases more options will be exposed.


# How it works

Hamsters.js attempts to mimic exactly how you would normally make functions in JavaScript in order to make threading your functions feel as natural as possible to your everyday work flow. The library is traditionally invoked by calling a function named `hamsters.run` this function takes several arguments that are paramount to making multi-threading easy on you. These arguments are described below and will be important to understand moving forward.

```js
hamsters.run(object, function, function, integer, boolean, string, boolean, string);
```

1. This required argument is our parameters object, this object is going to contain everything we want accessible within our execution context. Since threads are sand-boxed environments we cannot share scope with the main thread, it's important we add everything we need.

2. This required argument is going to be the function we want executed within our thread, any logic contained here will be sent to an available thread and executed there. It's important to note that in order to make things as simple as possible, the parameters object you passed previously can be accessed within this function from a internal `params` variable like so `var foo = params.bar;`.

3. This required argument is going to be our callback function which will return our final output from the previous function, this function takes only one argument which is simply your result and can be accessed like so `var result = arguments[0];`.

4. This optional argument will tell the library how many threads to execute the function declared previously across, this allows on a very easy level to change how many threads you are executing across. If you do not supply a value here the library defaults to a value of `1`.

5. This optional argument will tell the library whether or not we want to aggregate our individual thread outputs together after execution, this is only relevant if you are executing across multiple threads and defaults to `false`.

6. This optional argument will inform the library that our data array is one of JavaScript's [Typed Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays), when making use of this argument the library can make use of transferable objects which can provide a dramatic performance improvement compared to serialization. This value is `null` by default and should only be used when needed.

7. This optional argument is intended to be used in conjunction with [memoization mode](https://github.com/austinksmith/Hamsters.js/wiki/Memoization), when memoization mode is enabled this argument allows one to control on an individual function level whether or not the results from that function are cached, this has a default value of `false`.

8. This optional argument will tell the library to automatically sort our final output either alphabetically or numerically, this argument has a default value of `null` and can be configured using the [sorting options](https://github.com/austinksmith/Hamsters.js/wiki/Sorting).


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

You can find more information on how to make use of the library on the wiki links below.


[Limitations](https://github.com/austinksmith/Hamsters.js/wiki/Limitations)

[Performance Considerations](https://github.com/austinksmith/Hamsters.js/wiki/Performance-Considerations)

[Tested Devices & Browsers](https://github.com/austinksmith/Hamsters.js/wiki/Tested-Browsers-&-Devices)

[Debugging](https://github.com/austinksmith/Hamsters.js/wiki/Debugging)

[Tools](https://github.com/austinksmith/Hamsters.js/wiki/Tools)

[Sorting](https://github.com/austinksmith/Hamsters.js/wiki/Sorting)

[Persistence](https://github.com/austinksmith/Hamsters.js/wiki/Persistence)

[Memoization](https://github.com/austinksmith/Hamsters.js/wiki/Memoization)

[Transferrable Objects](https://github.com/austinksmith/Hamsters.js/wiki/Transferrable-Objects)
