/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/*
* Title: Hamsters.js
* Description: Javascript library to add multi-threading support to javascript by exploiting concurrent web workers
* Author: Austin K. Smith
* Contact: austin@asmithdev.com
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com
* License: Artistic License 2.0
*/

import hamstersData from './data';

'use strict';

class habitat {
  constructor() {
    this.browser = this.isBrowser();
    this.webWorker = this.isWebWorker();
    this.node = this.isNode();
    this.reactNative = this.isReactNative();
    this.shell = this.isShell();
    this.transferrable = this.supportsTransferrableObjects();
    this.legacy = this.isLegacyEnvironment();
    this.atomics = this.supportsAtomicOperations();
    this.proxies = this.supportsProxies();
    this.isIE = this.isInternetExplorer;
    this.logicalThreads = this.determineGlobalThreads();
    this.Worker = this.locateWorkerObject();
    this.sharedWorker = this.locateSharedWorkerObject();
  }

  determineGlobalThreads() {
    let max = 4;
    if(typeof navigator !== 'undefined') {
      if(typeof navigator.hardwareConcurrency !== 'undefined') {
        max = navigator.hardwareConcurrency;
      }
      if(max > 20 && navigator.userAgent.toLowerCase().indexOf('firefox') !== -1) {
        max = 20;
      }
    }
    if(this.isNode() && typeof os !== 'undefined') {
      max = os.cpus().length;
    }
    return max;
  }

  locateWorkerObject() {
    return Worker || null;
  }

  locateSharedWorkerObject() {
    return SharedWorker || null;
  }

  isBrowser() {
    return typeof window === "object";
  }

  isInternetExplorer(version) {
    return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
  }

  isNode() {
    return typeof process === "object" && typeof require === "function" && !this.isBrowser() && !this.isWebWorker();
  }

  isWebWorker() {
    return typeof importScripts === "function";
  }

  isReactNative() {
    return !this.isNode() && typeof global === 'object';
  }

  isShell() {
    return this.isBrowser() && !this.isNode() && !this.isWebWorker() && !this.isReactNative();
  }

  supportsTransferrableObjects() {
    return typeof Uint8Array !== 'undefined';
  }

  isLegacyEnvironment() {
    // Force legacy mode for known devices that don't support threading
    if (this.isBrowser() && !this.isReactNative()) {
      let isIE10 = this.habitat.isIE(10);
      let userAgent = navigator.userAgent;
      let lacksWorkerSupport = (typeof this.Worker === 'undefined');
      let legacyAgents = ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'];
      if (lacksWorkerSupport || legacyAgents.indexOf(userAgent) !== -1 || isIE10) {
        this.legacy = true;
      }
    }
    // Detect sharedWorker support for use within webworkers
    if (this.webWorker && typeof this.SharedWorker !== 'undefined') {
      try {
        let workerBlob = hamstersData.generateBlob();
        let SharedHamster = new this.SharedWorker(workerBlob, 'SharedHamsterWheel');
        hamstersData.workerURI = workerBlob;
      } catch (e) {
        this.legacy = true;
      }
    }
    // Final check, if we're in a shell environment or we have no worker object use legacy mode
    if(!this.legacy) {
      return this.isShell() || !this.locateWorkerObject();
    }
  }

  supportsAtomicOperations() {
    return typeof SharedArrayBuffer !== 'undefined';
  }

  supportsProxies() {
    return typeof Proxy !== 'undefined';
  }
}

var hamstersHabitat = new habitat();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersHabitat;
}
