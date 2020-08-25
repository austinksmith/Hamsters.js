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

const majorVersion = 5;
const minorVersion = 1;
const patchVersion = 3;
const hamstersVersion = `${majorVersion}.${minorVersion}.${patchVersion}`;

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersVersion;
}
