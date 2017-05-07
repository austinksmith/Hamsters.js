

  trainHamster: (id, aggregate, callback, task, hamster, memoize) => {
    function onmessage(e, results) {
      clean(task, id);
      results = e.data.results;
      task.output[id] = results.data;
      if(hamsters.debug === "verbose") {
        console.info("Hamster #" + id + " finished " + "@ " + e.timeStamp);
      }
      if(task.workers.length === 0 && task.count === task.threads) {
        if(task.order) {
          callback(sort(getOutput(task.output, aggregate, results.dataType), task.order));
        } else {
          callback(getOutput(task.output, aggregate, results.dataType));
        }
        if(hamsters.debug) {
          console.info("Execution Complete! Elapsed: " + ((e.timeStamp - task.input[0].start)/1000) + "s");
        }
        tasks[task.id] = null; //Clean up our task, not needed any longer
        if(hamsters.cache && memoize) {
          if(task.output[id] && !task.output[id].slice) {
            memoize(task.fn, task.input[0].input, normalizeArray(output), results.dataType);
          } else {
            memoize(task.fn, task.input[0].input, getOutput(task.output, aggregate, results.dataType), results.dataType);
          }
        }
      }
      if(queue.pending.length !== 0) {
        processQueue(hamster, queue.pending.shift());
      } else if(!hamsters.persistence && !env.worker) {
        hamster.terminate(); //Kill the thread only if no items waiting to run (20-22% performance improvement observed during testing, repurposing threads vs recreating them)
      }
    }

    function onerror(e) {
      if(!env.worker) {
        hamster.terminate(); //Kill the thread
      }
      errors.push({
        msg: "Error Hamster #" + id + ": Line " + e.lineno + " in " + e.filename + ": " + e.message
      });
      console.error("Error Hamster #" + id + ": Line " + e.lineno + " in " + e.filename + ": " + e.message);
    }

    if(env.worker) {
      hamster.port.onmessage = onmessage;
      hamster.port.onerror = onerror;
    } else {
      hamster.onmessage = onmessage;
      hamster.onerror = onerror;
    }   
  },