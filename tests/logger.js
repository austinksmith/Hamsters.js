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

  it("LogBook Error should save to error array", () => {
    expect(hamstersLogger.logBook.error.length).toEqual(0);
    hamstersLogger.error('The Miracle...You remember.');
    expect(hamstersLogger.logBook.error.length).toEqual(1);
  });

  it("LogBook Info should save to info array", () => {
    expect(hamstersLogger.logBook.info.length).toEqual(1);
    hamstersLogger.info('ISOs, isomorphic algorithms,');
    expect(hamstersLogger.logBook.info.length).toEqual(2);
  });

  it("LogBook Warning should save to warning array", () => {
    expect(hamstersLogger.logBook.warning.length).toEqual(0);
    hamstersLogger.warning('For centuries we dreamed of gods, spirits, aliens, and intelligence beyond our own.');
    expect(hamstersLogger.logBook.warning.length).toEqual(1);
  });

  it("CreateAndSaveStampedMessage should generate a time stamped message for info type", () => {
    let message = 'ISOs, isomorphic algorithms,';
    let timeStampedMessage = hamstersLogger.createAndSaveStampedMessage('info', message);
    expect(timeStampedMessage).toContain('Hamsters.js');
    expect(timeStampedMessage).toContain('info');
    expect(timeStampedMessage).toContain(message);
  });

  it("CreateAndSaveStampedMessage should generate a time stamped message for warning type", () => {
    let message = 'Biodigital jazz, man! The ISOs, they were going to be my gift to the world.';
    let timeStampedMessage = hamstersLogger.createAndSaveStampedMessage('warning', message);
    expect(timeStampedMessage).toContain('Hamsters.js');
    expect(timeStampedMessage).toContain('warning');
    expect(timeStampedMessage).toContain(message);
  });

  it("CreateAndSaveStampedMessage should generate a time stamped message for error type", () => {
    let message = 'I found them in here, like flowers in a wasteland. Profoundly naive; unimaginably wise. They were spectacular.';
    let timeStampedMessage = hamstersLogger.createAndSaveStampedMessage('error', message);
    expect(timeStampedMessage).toContain('Hamsters.js');
    expect(timeStampedMessage).toContain('error');
    expect(timeStampedMessage).toContain(message);
  });

  it("Search log book should return results for error event", () => {
    let message = 'I found them in here, like flowers in a wasteland. Profoundly naive; unimaginably wise. They were spectacular.';
    let savedMessageObject = hamstersLogger.searchLogEntries(message, 'error');
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain(message);
  });

  it("Search log book should return results for info event", () => {
    let message =  'ISOs, isomorphic algorithms,';
    let savedMessageObject = hamstersLogger.searchLogEntries(message, 'info');
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(2);
    expect(savedMessageObject.results[0]).toContain(message);
  });

  it("Search log book should return results for warning event", () => {
    let message = 'Biodigital jazz, man! The ISOs, they were going to be my gift to the world.';
    let savedMessageObject = hamstersLogger.searchLogEntries(message, 'warning');
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain(message);
  });

  it("Search log book should return results without error event", () => {
    let message = 'I found them in here, like flowers in a wasteland. Profoundly naive; unimaginably wise. They were spectacular.';
    let savedMessageObject = hamstersLogger.searchLogEntries(message);
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain(message);
  });

  it("Search log book should return results without info event", () => {
    let message = 'ISOs, isomorphic algorithms,';
    let savedMessageObject = hamstersLogger.searchLogEntries(message);
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(2);
    expect(savedMessageObject.results[0]).toContain(message);
  });

  it("Search log book should return results without warning event", () => {
    let message = 'Biodigital jazz, man! The ISOs, they were going to be my gift to the world.';
    let savedMessageObject = hamstersLogger.searchLogEntries(message);
    expect(typeof savedMessageObject).toEqual('object');
    expect(savedMessageObject.total).toEqual(1);
    expect(savedMessageObject.results[0]).toContain(message);
  });
});