/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

/* jshint esversion: 6 */

'use strict';

const majorVersion = 4;
const minorVersion = 2;
const patchVersion = 2;
const hamstersVersion = `${majorVersion}.${minorVersion}.${patchVersion}`;

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersVersion;
}
