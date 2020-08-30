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

class version {
	constructor() {
		this.majorVersion = 5;
		this.minorVersion = 2;
		this.patchVersion = 3;
		this.current = this.getHamstersVersion();
	}

	getHamstersVersion() {
		return `${this.majorVersion}.${this.minorVersion}.${this.patchVersion}`;
	}
}

export default new version();
