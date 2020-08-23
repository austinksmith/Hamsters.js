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

import hamstersVersion from './version';

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
    this.createAndSaveStampedMessage = this.generateTimeStampedMessage;
    this.searchLogEntries = this.searchLogBook;
  }

  infoLog(message) {
    let timeStampedMessage = this.createAndSaveStampedMessage('Info', message);
    console.info(timeStampedMessage);
  }

  warningLog(message) {
    let timeStampedMessage = this.createAndSaveStampedMessage('Warning', message);
    console.warn(timeStampedMessage);
  }

  errorLog(message, reject) {
    let timeStampedMessage = this.createAndSaveStampedMessage('Error', message);
    console.error(timeStampedMessage);
    if(reject) {
      reject(timeStampedMessage);
    } else {
      return timeStampedMessage;
    }
  }

  generateTimeStampedMessage(type, message) {
    let record = `Hamsters.js v${hamstersVersion} ${type}: ${message} @ ${Date.now()}`
    this.saveLogEntry(type.toLowerCase(), record);
    return record;
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

  findStringInLogBook(logBookEntries, searchString) {
    let searchResults = [];
    let i = 0;
    for (i; i < logBookEntries.length; i++) {
      if(logBookEntries[i].indexOf(searchString) !== -1) {
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
        for (var i = eventTypeResults.length - 1; i >= 0; i--) {
          searchResults.push(eventTypeResults[i])
        }
      }
    }
    return searchResults;
  }

  searchLogBook(searchString, eventType) {
    let finalResults = [];
    if(eventType) {
      finalResults = this.findStringInLogBook(this.logBook[eventType], searchString);
    } else {
      finalResults = this.findStringInLogBookAllTypes(this.logBook, searchString);
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
