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

# Restructoring standard functions

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




