  newTask: (taskid, workers, order, dataType, fn, cb) => {
    this.tasks.push({
      id: taskid,
      workers: [],
      count: 0,
      threads: workers, 
      input: [],
      dataType: dataType || null,
      fn: fn,
      output: [], 
      order: order || null,
      callback: cb
    });
    return this.tasks[taskid];
  },