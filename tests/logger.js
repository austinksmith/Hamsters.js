/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersLogger from '../src/core/logger';

describe("Hamsters Logger", () => {

  it("LogBook should be an object", () => {
    expect(typeof hamstersLogger.logBook).toEqual('object');
  });

  it("LogBook Errors should be an array", () => {
    expect(typeof hamstersLogger.logBook.error).toEqual('object');
    expect(hamstersLogger.logBook.error.length).toEqual(1);
  });

  it("LogBook Warning should be an empty array", () => {
    expect(hamstersLogger.logBook.warning).toEqual([]);
    expect(hamstersLogger.logBook.warning.length).toEqual(0);
  });

  it("LogBook Info should be an empty array", () => {
    expect(hamstersLogger.logBook.info).toEqual([]);
    expect(hamstersLogger.logBook.info.length).toEqual(0);
  });

  it("LogBook Error should save to error array", () => {
    expect(hamstersLogger.logBook.error.length).toEqual(1);
    hamstersLogger.error('Pay no mind to the hamster behind the curtain');
    expect(hamstersLogger.logBook.error.length).toEqual(2);
  });

  it("LogBook Info should save to info array", () => {
    expect(hamstersLogger.logBook.info.length).toEqual(0);
    hamstersLogger.info('The hamster we need but dont deserve');
    expect(hamstersLogger.logBook.info.length).toEqual(1);
  });

  it("LogBook Warning should save to warning array", () => {
    expect(hamstersLogger.logBook.warning.length).toEqual(0);
    hamstersLogger.warning('One hamster to rule them all');
    expect(hamstersLogger.logBook.warning.length).toEqual(1);
  });

  it("CreateAndSaveStampedMessage should generate a time stamped message for info type", () => {
    let timeStampedMessage = hamstersLogger.createAndSaveStampedMessage('info', 'One hamster at a time');
    expect(timeStampedMessage).toContain('Hamsters.js');
    expect(timeStampedMessage).toContain('info');
    expect(timeStampedMessage).toContain('One hamster at a time');
  });

  it("CreateAndSaveStampedMessage should generate a time stamped message for warning type", () => {
    let timeStampedMessage = hamstersLogger.createAndSaveStampedMessage('warning', 'Some hamsters do an awful lot of talking without a brain');
    expect(timeStampedMessage).toContain('Hamsters.js');
    expect(timeStampedMessage).toContain('warning');
    expect(timeStampedMessage).toContain('Some hamsters do an awful lot of talking without a brain');
  });

  it("CreateAndSaveStampedMessage should generate a time stamped message for error type", () => {
    let timeStampedMessage = hamstersLogger.createAndSaveStampedMessage('error', 'Hamsters rule the world');
    expect(timeStampedMessage).toContain('Hamsters.js');
    expect(timeStampedMessage).toContain('error');
    expect(timeStampedMessage).toContain('Hamsters rule the world');
  });

  it("Search log book should return results for error event", () => {
    let savedMessageObject = hamstersLogger.searchLogBook('Hamsters rule', 'error');
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain('Hamsters rule the world');
  });

  it("Search log book should return results for info event", () => {
    let savedMessageObject = hamstersLogger.searchLogBook('One hamster', 'info');
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain('One hamster at a time');
  });

  it("Search log book should return results for warning event", () => {
    let savedMessageObject = hamstersLogger.searchLogBook('talking without a brain', 'warning');
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain('Some hamsters do an awful lot of talking without a brain');
  });

  it("Search log book should return results without error event", () => {
    let savedMessageObject = hamstersLogger.searchLogBook('Hamsters rule');
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain('Hamsters rule the world');
  });

  it("Search log book should return results without info event", () => {
    let savedMessageObject = hamstersLogger.searchLogBook('at a time');
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain('One hamster at a time');
  });

  it("Search log book should return results without warning event", () => {
    let savedMessageObject = hamstersLogger.searchLogBook('talking without a brain');
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain('Some hamsters do an awful lot of talking without a brain');
  });

});