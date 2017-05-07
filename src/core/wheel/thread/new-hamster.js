  newHamster: () => {
    if(env.worker) {
      return new SharedWorker(uri, "SharedHamsterWheel");
    }
    if(env.ie10) {
      return new Worker("src/common/wheel.min.js");
    }
    return new Worker(uri);
  },