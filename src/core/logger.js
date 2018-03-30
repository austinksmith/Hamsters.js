/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersVersion from './version';

'use strict';

class logger {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.logBook = {
      error: [], 
      warning: [], 
      info: []
    };
    this.info = this.infoLog;
    this.warning = this.warningLog;
    this.error = this.errorLog;
    this.errorFromThread = this.errorFromThread;
    this.saveLogEntry = this.saveToLogBook;
    this.getLogEntries = this.fetchLogBook;
    this.searchLogEntries = this.searchLogBook;
  }

  infoLog(message) {
    let timeStamp = Date.now();
    let timeStampedMessage = `Hamsters.js v${hamstersVersion} Info: ${message} @ ${timeStamp}`;
    this.saveLogEntry('info', timeStampedMessage);
    console.info(timeStampedMessage);
  }

  warningLog(message) {
    let timeStamp = Date.now();
    let timeStampedMessage = `Hamsters.js v${hamstersVersion} Warning: ${message} @ ${timeStamp}`;
    this.saveLogEntry('warning', timeStampedMessage);
    console.warn(timeStampedMessage);
  }

  errorLog(message, reject) {
    let timeStamp = Date.now();
    let timeStampedMessage = `Hamsters.js v${hamstersVersion} Error: ${message} @ ${timeStamp}`;
    this.saveLogEntry('error', timeStampedMessage);
    console.error(timeStampedMessage);
    if(reject) {
      reject(timeStampedMessage);
    } else {
      return timeStampedMessage;
    }
  }

  errorFromThread(error, reject) {
    let errorMessage = `#${error.lineno} in ${error.filename}: ${error.message}`;
    this.errorLog(errorMessage, reject);
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

  findStringInLogBook(logBookEntries, string) {
    let searchResults = [];
    let i = 0;
    for (i; i < logBookEntries.length; i++) {
      if(logBookEntries[i].indexOf(string) !== -1) {
        searchResults.push(logBookEntries[i]);
      }
    }
    return searchResults;
  }

  findStringInLogBookAllTypes(logBook, searchString) {
    let searchResults = [];
    let key, eventTypeResults, tmpEntries = null;
    for(key in logBook) {
      if(logBook.hasOwnProperty(key)) {
        tmpEntries = logBook[key];
        eventTypeResults = this.findStringInLogBook(tmpEntries, searchString);
      }
    }
    return searchResults;
  }

  searchLogBook(searchString, eventType) {
    let finalResults = [];
    if(eventType) {
      finalResults = this.findStringInLogBook(this.logBook[eventType], string);
    } else {
      finalResults = this.findStringInLogBookAllTypes(this.logBook);
    }
    return {
      total: finalResults.length,
      results: finalResults
    };
  }   
}

var hamstersLogger = new logger();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersLogger;
}
