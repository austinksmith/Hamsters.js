/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

'use strict';

const majorVersion = 7;
const minorVersion = 7;
const patchVersion = 7;
const hamstersVersion = `${majorVersion}.${minorVersion}.${patchVersion}`;

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersVersion;
}
