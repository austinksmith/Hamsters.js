/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const stringifyJSON = require("./json/stringify-json");
const parseJSON = require("./json/parse-json");
const randomArray = require("./array/random-array");
const aggregateArrays = require("./array/aggregate-arrays");
const sortArray = require("./array/sort-array");
const splitArray = require("./array/split-array");
const loopAbstraction = require("./abstractions/loop-abstraction");

const hamsterTools = {
	stringifyJson: stringifyJSON,
	parseJson: parseJSON,
	randomArray: randomArray,
	aggregate: aggregateArrays,
	sort: sortArray,
	splitArray: splitArray,
	loop: loopAbstraction 
};

module.exports = () => {
	return hamsterTools;
};