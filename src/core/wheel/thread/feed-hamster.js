"use strict";


  feedHamster: (hamster, food) => {
    if(this.env.worker) {
      return hamster.port.postMessage(food);
    }
    if(this.env.ie10) {
      return hamster.postMessage(food);
    }
    let buffers = [], key;
    for(key in food) {
      if(food.hasOwnProperty(key) && food[key] && food[key].buffer) {
        buffers.push(food[key].buffer);
      }
    }
    return hamster.postMessage(food,  buffers);
  } 