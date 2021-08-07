/* jshint esversion: 5, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import { self } from 'react-native-hamsters';

(function () {
    self.params = {};
    self.rtn = {};
    self.onmessage = message => {
      params = JSON.parse(message);
      rtn = {
        data: []
      };
      eval(params.hamstersJob);
      return returnResponse(rtn);
    };

    const returnResponse = rtn => {
      return self.postMessage(JSON.stringify(rtn));
    }
}());