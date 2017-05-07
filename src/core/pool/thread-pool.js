
module.exports = () => {
	"use strict";

	return {
		pending: [],
		running: [],
		poolThread: (inputArray, hamsterfood, threadid, cb, task, agg, memoize) => {
	    this.pending.push({
	      memoize: memoize,
	      input: inputArray,
	      params: hamsterfood,
	      workerid: threadid, 
	      callback: cb, 
	      task: task,
	      aggregate: agg
	    });
	  },
	  processQueue: (hamster, item) => {
	    if(!item) {
	      return;
	    }
	    newWheel(item.input, item.params, item.aggregate, item.callback, item.task, item.workerid, hamster, item.memoize); //Assign most recently finished thread to queue item
	  },
	  trackInput: (inputArray, threadid, task, hamsterfood) => {
	    task.input.push({ 
	      input: inputArray,
	      workerid: threadid, 
	      taskid: task.id, 
	      params: hamsterfood, 
	      start: new Date().getTime()
	    });
	  },
	  trackThread: (task, running, id) => {
	    task.workers.push(id); //Keep track of threads scoped to current task
	    this.running.push(id); //Keep track of all currently running threads
	  },
	  poolThread: (inputArray, hamsterfood, threadid, cb, task, agg, memoize) => {
	    this.pending.push({
	      memoize: memoize,
	      input: inputArray,
	      params: hamsterfood,
	      workerid: threadid, 
	      callback: cb, 
	      task: task,
	      aggregate: agg
	    });
	  },
	};
};