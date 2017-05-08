
"use strict";

module.exports = (arr, order) => {
  switch(order) {
    case "desc":
    case "asc":
      return Array.prototype.sort.call(arr, (a, b) => order === "asc" ? (a - b) : (b - a));
    case "ascAlpha":
      return arr.sort();
    case "descAlpha":
      return arr.reverse();
    default:
      return arr;
  }
};