/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/


"use strict";

module.exports = (textContent) => {
  if(!Blob) {
    var BlobBuilder = BlobBuilder || WebKitBlobBuilder || MozBlobBuilder || MSBlobBuilder;
    var blob = new BlobBuilder();
    blob.append([textContent], {
      type: 'application/javascript'
    });
    return blob.getBlob();
  } 
  return new Blob([textContent], {
    type: 'application/javascript'
  });
};