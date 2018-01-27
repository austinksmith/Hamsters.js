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

class logger {
  constructor() {
    this.logBook = {
      error: [], 
      warning: [], 
      info: []
    };
    this.info = this.infoLog;
    this.warning = this.warningLog;
    this.error = this.errorLog;
    this.saveLogEntry = this.saveToLogBook;
    this.getLogEntries = this.fetchLogBook;
    this.searchLogEntries = this.searchLogBook;
  }

  infoLog(message) {
    let timeStamp = Date.now();
    let timeStampedMessage = `Hamsters.js Info: ${message} @ ${timeStamp}`;
    this.saveLogEntry('info', timeStampedMessage);
    console.info(timeStampedMessage);
  }

  warningLog(message) {
    let timeStamp = Date.now();
    let timeStampedMessage = `Hamsters.js Warning: ${message} @ ${timeStamp}`;
    this.saveLogEntry('warning', timeStampedMessage);
    console.warning(timeStampedMessage);
  }

  errorLog(message, reject) {
    let timeStamp = Date.now();
    let timeStampedMessage = `Hamsters.js Error: ${message} @ ${timeStamp}`;
    this.saveLogEntry('error', timeStampedMessage);
    console.error(timeStampedMessage);
    reject(timeStampedMessage);
  }

  saveToLogBook(eventType, message) {
    this.logBook[eventType].push(message);
  }

  fetchLogBook(eventType) {
    if(eventType) {
      return this.logBook[eventType];
    }
    return this.logBook;
  }

  findStringInArray(array, string) {
    let results = [];
    for (var i = 0; i < array.length; i++) {
      if(array[i].indexOf(string) !== -1) {
        results.push(array[i]);
      }
    }
    return results;
  }

  searchLogBook(string, eventType) {
    let finalResults = [];
    let tmpEntries;
    let eventTypeResults;
    if(eventType) {
      tmpEntries = this.logBook[eventType];
      finalResults = this.findStringInArray(tmpEntries, string);
    } else {
      for(var key in this.logBook) {
        if(this.logBook.hasOwnProperty(key)) {
          tmpEntries = this.logBook[key];
          eventTypeResults = this.findStringInArray(tmpEntries, string);
          if(eventTypeResults.length !== 0) {
            finalResults = [finalResults, eventTypeResults].reduce(function(a, b) {
              return a.concat(b);
            });
          }
        }
      }
    }
    return {
      total: finalResults.length,
      results: finalResults
    };
  }   
}

var hamsterLogger = new logger();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterLogger;
}
