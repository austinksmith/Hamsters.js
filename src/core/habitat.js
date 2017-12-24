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

class habitat {
  constructor() {
    this.browser = this.isBrowser();
    this.worker = this.isWorker();
    this.node = this.isNode();
    this.reactNative = this.isReactNative();
    this.shell = this.isShell();
    this.transferrable = this.supportsTransferrableObjects();
    this.legacy = this.isLegacyEnvironment();
    this.atomics = this.supportsAtomicOperations();
    this.proxies = this.supportsProxies();
    this.isIE = this.isInternetExplorer;
    this.logicalThreads = this.determineGlobalThreads();
  }

  determineGlobalThreads() {
    // Default to global thread count of 4
    let max = 4;
    // Detect logical core count on machine
    if(typeof navigator !== 'undefined') {
      if(typeof navigator.hardwareConcurrency !== 'undefined') {
        max = navigator.hardwareConcurrency;
      }
      // Firefox per origin limit is 20
      if(navigator.userAgent.toLowerCase().indexOf('firefox') !== -1 && max > 20) {
        max = 20;
      }
    }
    // Got it
    return max;
  }

  isBrowser() {
    return typeof window === "object";
  }

  isInternetExplorer(version) {
    return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
  }

  isNode() {
    return typeof process === "object" && typeof require === "function" && !this.isBrowser() && !this.isWorker();
  }

  isWorker() {
    return typeof importScripts === "function";
  }

  isReactNative() {
    return !this.isNode() && typeof global === 'object';
  }

  isShell() {
    return this.isBrowser() && !this.isNode() && !this.isWorker() && !this.isReactNative();
  }

  supportsTransferrableObjects() {
    return typeof Uint8Array !== 'undefined';
  }

  isLegacyEnvironment() {
    return (this.isShell() || typeof Worker === 'undefined');
  }

  supportsAtomicOperations() {
    return typeof SharedArrayBuffer !== 'undefined';
  }

  supportsProxies() {
    return typeof Proxy !== 'undefined';
  }
}

var hamsterHabitat = new habitat();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterHabitat;
}
