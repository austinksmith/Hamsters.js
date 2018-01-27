# Hamsters.js
[![Backers on Open Collective](https://opencollective.com/hamstersjs/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/hamstersjs/sponsors/badge.svg)](#sponsors)

**Author**: Austin K. Smith

**Website**: [Hamsters.io](http://www.hamsters.io)

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

1. Use npm to install hamsters.js `npm install hamsters.js --save`
2. Import the library into your `App.js` file like below

```js
  import hamsters from 'hamsters.js';
```
 
**Node.js**

1. Use npm to install hamsters.js `npm install hamsters.js --save`
2. Import the library into your `app.js` file like below

```js
  var hamsters = require('hamsters.js');
```

It's important to note that neither ReactNative or Node.js ships with a native WebWorker implementation out of the box and the library will therefore make use of the legacy fallback mode allowing you to still write your logic and validate it works with the library but will not provide the performance benefits of multiple threads. To resolve this you will need to make use of a third party worker implementation, there are many of these on npm and github, the library should work with any implementation that adheres to the worker specifications. Once you've obtained a third party worker implementation package you can simply follow the instructions below to integrate with Hamsters.js

* React Native

```js
  import Worker from '...';
  import hamsters from 'hamsters.js';

  hamsters.init({
    maxThreads: 2,
    Worker: Worker
  });
```

* Node.js

```js
  var Worker = require('...').Worker;
  var hamsters = require('hamsters.js');

  hamsters.init({
    maxThreads: 2,
    Worker: Worker
  });
```

**Other Environments**

You can also use bower or npm to install the library in other environments though support is not guaranteed, submit a ticket if you encounter problems.

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
    debug: boolean,
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

```js
  var params = {
    array: [1,2,3,4,5,6,7,8,9,10],
    foo: ....,
    bar: ....
  };
```

2. This required argument is going to be the function we want executed within our thread, any logic contained here will be sent to an available thread and executed there. It's important to note that in order to make things as simple as possible, the parameters object you passed previously can be accessed within this function from a internal `params` variable like so `var foo = params.bar;`.

3. This required argument is going to be our callback function which will return our final output from the previous function, this function takes only one argument which is simply your result and can be accessed like so `var result = arguments[0];`.

4. This optional argument will tell the library how many threads to execute the function declared previously across, this allows on a very easy level to change how many threads you are executing across. If you do not supply a value here the library defaults to a value of `1`.

5. This optional argument will tell the library whether or not we want to aggregate our individual thread outputs together after execution, this is only relevant if you are executing across multiple threads and defaults to `false`.

6. This optional argument will inform the library that our data array is one of JavaScript's [Typed Arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays), when making use of this argument the library can make use of transferable objects which can provide a dramatic performance improvement compared to serialization. This value is `null` by default and should only be used when needed.

7. This optional argument is intended to be used in conjunction with [memoization mode](http://www.hamsters.io/wiki#memoization), when memoization mode is enabled this argument allows one to control on an individual function level whether or not the results from that function are cached, this has a default value of `false`.

8. This optional argument will tell the library to automatically sort our final output either alphabetically or numerically, this argument has a default value of `null` and can be configured using the [sorting options](http://www.hamsters.io/wiki#sorting).


# How the library manages your data

In order to enable the library to automatically manage your data and execution across many threads there are a few conventions that were chosen that you will need to follow when making use of the library.

1. When using multiple threads the library needs a consistent place to look at the data supplied to control which pieces of your input data go to which threads, to accomplish this the library expects any array that you want executed across multiple threads must have the index of `array`. Any arrays you pass inside your parameters object that does *not* have the index of `array` will be copied to all threads.

```js
  var params = {
    array: [1,2,3,4,5,6,7,8,9,10]
  };
```

2. Similar to the above, the library needs a consistent way to handle outputs from threads, this is accomplished by an internal `rtn` object, inside of your function body you should pass any and all output data into the `rtn.data` array. You can also simply make `rtn.data` your output however it's recommended you simply push your output into the existing `rtn.data` array as it will already match your input array type.

```js
  hamsters.run(params, function() {
    rtn.data.push("Hamsters");
  }, function(result) {
     alert(result + " are awesome");
  });
```

3. The same parameters object mentioned above is also accessible within your execution scope with a `params` object, this object will contain everything you included.

```js
  var params = {
    array: [1,2,3,4,5,6,7,8,9,10],
    animal: 'Hamster'
  };
  hamsters.run(params, function() {
    if(params.animal === 'Hamster') {
      rtn.data.push("Hamsters are awesome");
    }
  }, function(result) {
     alert(result);
  });
```

You can find more information on how to make use of the library on the wiki links below.

[Restructoring Standard Functions](http://www.hamsters.io/wiki#restructuring-standard-functions)

[Tools](http://www.hamsters.io/wiki#tools)

[Sorting](http://www.hamsters.io/wiki#sorting)

[Persistence](http://www.hamsters.io/wiki#persistence)

[Memoization](http://www.hamsters.io/wiki#memoization)

[Transferable  Objects](http://www.hamsters.io/wiki#transferable-objects)

[Limitations](http://www.hamsters.io/wiki#limitations)

[Performance Considerations](http://www.hamsters.io/wiki#performance-considerations)

[Debugging](http://www.hamsters.io/wiki#debugging)

[Tested Devices & Browsers](http://www.hamsters.io/wiki#tested-devices-amp-browsers)


# Support Hamsters.js

Your support makes projects like this possible, please consider supporting this project by visiting [our page on patreon.com](https://www.patreon.com/asmithdev)!

## Contributors

This project exists thanks to all the people who contribute. [[Contribute](CONTRIBUTING.md)].
<a href="graphs/contributors"><img src="https://opencollective.com/hamstersjs/contributors.svg?width=890" /></a>


## Backers

Thank you to all our backers! 🙏 [[Become a backer](https://opencollective.com/hamstersjs#backer)]

<a href="https://opencollective.com/hamstersjs#backers" target="_blank"><img src="https://opencollective.com/hamstersjs/backers.svg?width=890"></a>


## Sponsors

Support this project by becoming a sponsor. Your logo will show up here with a link to your website. [[Become a sponsor](https://opencollective.com/hamstersjs#sponsor)]

<a href="https://opencollective.com/hamstersjs/sponsor/0/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/hamstersjs/sponsor/1/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/hamstersjs/sponsor/2/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/hamstersjs/sponsor/3/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/hamstersjs/sponsor/4/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/hamstersjs/sponsor/5/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/hamstersjs/sponsor/6/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/hamstersjs/sponsor/7/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/hamstersjs/sponsor/8/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/hamstersjs/sponsor/9/website" target="_blank"><img src="https://opencollective.com/hamstersjs/sponsor/9/avatar.svg"></a>


