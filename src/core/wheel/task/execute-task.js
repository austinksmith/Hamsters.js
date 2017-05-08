"use strict";

  work: (task, params, fn, callback, aggregate, dataType, memoize, order) => {
    let workArray = params.array || null;
    if(params.array && task.threads !== 1) {
      workArray = hamsters.tools.splitArray(params.array, task.threads); //Divide our array into equal array sizes
    }
    let food = {};
    let key;
    for(key in params) {
      if(params.hasOwnProperty(key) && key !== "array") {
        food[key] = params[key];
      }
    }
    food.fn = hamsters.tools.prepareFunction(fn);
    food.dataType = dataType;
    let i = 0;
    while(i < task.threads) {
      if(workArray && task.threads !== 1) {
        this.newWheel(workArray[i], food, aggregate, callback, task, task.count, null, memoize);
      } else {
        this.newWheel(workArray, food, aggregate, callback, task, task.count, null, memoize);
      }
      i += 1;
    }
  },