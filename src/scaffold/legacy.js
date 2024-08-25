/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class Legacy {

    /**
    * @constructor
    * @function constructor - Sets properties for this class
    */
    constructor(hamsters) {
      this.hamsters = hamsters;
      this.scaffold = this.legacyScaffold.bind(this);
    }
   
    /**
    * @function legacyScaffold - Provides library functionality for legacy devices
    */
    legacyScaffold(params, resolve, reject) {
      var rtn = {
        data: [],
        dataType: (typeof params.dataType !== "undefined" ? params.dataType : null)
      };
      if(this.hamsters.habitat.reactNative) {
        self.rtn = rtn;
      }
      if(this.hamsters.habitat.node || this.hamsters.habitat.isIE) {
        eval(params.hamstersJob);
      } else {
        params.hamstersJob();
      }
      resolve(rtn.data);
    }
  }
  
  export default Legacy;
  