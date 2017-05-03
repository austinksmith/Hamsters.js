"use strict";

exports.tools = {

  splitArray: (array, n) => {
    let i = 0;
    let tasks = [];
    let size = Math.ceil(array.length/n);
    if(array.slice) {
      while(i < array.length) {
        tasks.push(array.slice(i, i += size));
      }
    } else {
      while (i < array.length) {
        tasks.push(array.subarray(i, i += size));
      }
    }
    return tasks;
  },

  loop: (input, onSuccess) => {
    let params = {
      run: prepareFunction(input.operator),
      init: input.startIndex || 0,
      limit: input.limit,
      array: input.array,
      incrementBy: input.incrementBy || 1,
      dataType: input.dataType || null,
      worker: hamsters.wheel.env.worker
    };
    hamsters.run(params, () => {
      let operator = self.params.run;
      if(typeof operator === "string") {
        if(params.worker) {
          operator = eval("(" + operator + ")");
        } else {
          operator = new Function(operator);
        }
      }
      if(!params.limit) {
        params.limit = params.array.length;
      }
      let i = params.init;
      for (i; i < params.limit; i += params.incrementBy) {
        rtn.data[i] = operator(params.array[i]);
      }
    }, (output) => {
      onSuccess(output);
    }, input.threads, 1, input.dataType);
  },

  prepareFunction: (functionBody) => {
    if(!hamsters.wheel.env.legacy) {
      functionBody = String(functionBody);
      if(!hamsters.wheel.env.worker) {
        let startingIndex = (functionBody.indexOf("{") + 1);
        let endingIndex = (functionBody.length - 1);
        return functionBody.substring(startingIndex, endingIndex);
      }
    }
    return functionBody;
  },

  parseJson: (string, onSuccess) => {
    hamsters.run({input: string}, () => {
      rtn.data = JSON.parse(params.input);
    }, (output) => {
      onSuccess(output[0]);
    }, 1);
  },

  stringifyJson: (json, onSuccess) => {
    hamsters.run({input: json}, () => {
      rtn.data = JSON.stringify(params.input);
    }, (output) => {
      onSuccess(output);
    }, 1);
  },

  randomArray: (count, onSuccess) => {
    let params = {
      count: count
    };
    hamsters.run(params, () => {
      while(params.count > 0) {
        rtn.data[rtn.data.length] = Math.round(Math.random() * (100 - 1) + 1);
        params.count -= 1;
      }
    }, (output) => {
      onSuccess(output);
    });
  },

  aggregate: (input, dataType) => {
    if(!dataType || !hamsters.wheel.env.transferrable) {
      return input.reduce((a, b) => a.concat(b));
    }
    let i = 0;
    let len = input.length;
    let bufferLength = 0;
    for (i; i < len; i += 1) {
      bufferLength += input[i].length;
    }
    let output = hamsters.wheel.processDataType(dataType, bufferLength);
    let offset = 0;
    for (i = 0; i < len; i += 1) {
      output.set(input[i], offset);
      offset += input[i].length;
    }
    return output;
  }
}