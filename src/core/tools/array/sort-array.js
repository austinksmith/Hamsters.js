/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

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