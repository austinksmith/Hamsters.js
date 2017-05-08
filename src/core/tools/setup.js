/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

const stringifyJSON = require("./json/stringify-json");
const parseJSON = require("./json/parse-json");
const randomArray = require("./array/random-array");
const aggregateArrays = require("./array/aggregate-arrays");
const sortArray = require("./array/sort-array");
const splitArray = require("./array/split-array");
const loopAbstraction = require("./abstractions/loop-abstraction");

const hamstersTools = () => {
	this.stringifyJson = stringifyJSON,
	this.parseJson = parseJSON,
	this.randomArray = randomArray,
	this.aggregate = aggregateArrays,
	this.sort = sortArray,
	this.splitArray = splitArray,
	this.loop = loopAbstraction 
};

module.exports = () => {
	return new hamsterTools();
};