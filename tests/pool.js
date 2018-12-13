/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersPool from '../src/core/pool';

describe("Hamsters Pool", () => {

  it("Tasks should be an array", () => {
    expect(Array.isArray(hamstersPool.tasks)).toEqual(true);
  });

  it("Threads should be an array", () => {
    expect(Array.isArray(hamstersPool.threads)).toEqual(true);
  });

  it("Running should be an array", () => {
    expect(Array.isArray(hamstersPool.running)).toEqual(true);
  });

  it("Pending should be an array", () => {
    expect(Array.isArray(hamstersPool.pending)).toEqual(true);
  });

  it("Tasks should be an empty array", () => {
    expect(hamstersPool.tasks.length).toEqual(0);
  });

  it("Threads should be an empty array", () => {
    expect(hamstersPool.threads.length).toEqual(0);
  });

  it("Running should be an empty array", () => {
    expect(hamstersPool.running.length).toEqual(0);
  });

  it("Pending should be an empty array", () => {
    expect(hamstersPool.pending.length).toEqual(0);
  });

  it("addWorkToPending should queue work item for later use", () => {
    let tmpTask = {id: 0, threads: 1};
    let tmpArray = [1, 2];
    let wheel = function() {};
    let resolve = function() {};
    let reject = function() {}
    hamstersPool.addWorkToPending(tmpArray, tmpTask, false, wheel, resolve, reject);
    let pendingWorkItem = hamstersPool.pending[0];
    expect(pendingWorkItem[0]).toEqual(tmpArray);
    expect(pendingWorkItem[1]).toEqual(tmpTask);
    expect(pendingWorkItem[2]).toEqual(false);
    expect(typeof pendingWorkItem[3]).toEqual('function');
    expect(typeof pendingWorkItem[4]).toEqual('function');
    expect(typeof pendingWorkItem[5]).toEqual('function');
  });

  it("prepareMeal should construct params object variables", () => {
    let taskInput = {
      hamstersJob: `function() { console.log('The world is run by..') }`,
      array: [1, 2, 3, 4],
      ranVar: 'hamster powered',
      dataType: 'Int32'
    };
    let task = {
      id: 1,
      input: taskInput
    };
    let meal = hamstersPool.prepareMeal(taskInput.array, task);
    expect(typeof meal).toEqual('object');
    expect(meal.hamstersJob).toEqual(taskInput.hamstersJob);
    expect(meal.dataType).toEqual('Int32');
    expect(meal.ranVar).toEqual('hamster powered');
  });
});