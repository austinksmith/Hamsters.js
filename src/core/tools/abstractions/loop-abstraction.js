


"use strict";


module.exports = (input, onSuccess) => {
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

};