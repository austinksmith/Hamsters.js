
const splitArray = (array, n) => {
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
};

module.exports = splitArray;