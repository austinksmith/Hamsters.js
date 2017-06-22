/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

const legacyProcessor = require("../processor/legacy-processor");
const modernProcessor = require("../processor/modern-processor");
const environment = require("../environment/setup-environment");

module.exports = () => {
	if(environment.legacy) {
		return legacyProcessor;
	}
	return modernProcessor;
};