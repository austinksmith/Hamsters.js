

const trackThread = require("./");
const trackInput = require("./");
const memoize = require("./");
const clean = require("./");


  legacyProcessor: (params, inputArray, callback) => {
    setTimeout(() => {
      self.rtn = {
        success: true, 
        data: []
      };
      self.params = params;
      self.params.array = inputArray;
      self.params.fn();
      if(self.params.dataType && self.params.dataType != "na") {
        self.rtn.data = processDataType(self.params.dataType, self.rtn.data);
        self.rtn.dataType = self.params.dataType;
      }
      callback(self.rtn);
    }, 4); //4ms delay (HTML5 spec minimum), simulate threading
  },

module.exports = (inputArray, hamsterfood, aggregate, onSuccess, task, threadid, hamster, memoize) => {
  trackThread(task, hamsters.wheel.queue.running, threadid);
  if(memoize || hamsters.debug) {
    trackInput(inputArray, threadid, task, hamsterfood);
  }
  this.legacyProcessor((hamsterfood, inputArray, output) => {
    hamsters.wheel.clean(task, threadid);
    task.output[threadid] = output.data;
    if(task.workers.length === 0 && task.count === task.threads) {
      onSuccess(getOutput(task.output, aggregate, output.dataType));
      hamsters.wheel.tasks[task.id] = null;
      if(hamsters.cache && memoize !== false) {
        memoize(task.fn, task.input, output.data, output.dataType);
      }
    }
  });
  task.count += 1; //Thread finished
};