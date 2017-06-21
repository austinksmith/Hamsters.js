/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

"use strict";

module.exports = (params, inputArray, onSuccess) => {
  setTimeout(() => {
    self.rtn = {
      success: true, 
      data: []
    };
    self.params = params;
    self.params.array = inputArray;
    self.params.fn();
    if(self.params.dataType && self.params.dataType != "na") {
      self.rtn.data = processDataType(self.params.dataType, self.rtn.data);
      self.rtn.dataType = self.params.dataType;
    }
    onSuccess(self.rtn);
  }, 4); //4ms delay (HTML5 spec minimum), simulate threading
};
