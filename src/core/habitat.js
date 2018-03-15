/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

import hamstersData from './data';

'use strict';

class habitat {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.debug = false;
    this.importScripts = null;
    this.memoize = false;
    this.persistence = true;
    this.legacy = this.isLegacyEnvironment() || false;
    this.browser = this.isBrowser();
    this.webWorker = this.isWebWorker();
    this.node = this.isNode();
    this.reactNative = this.isReactNative();
    this.shell = this.isShell();
    this.transferrable = this.supportsTransferrableObjects();
    this.atomics = this.supportsAtomicOperations();
    this.proxies = this.supportsProxies();
    this.isIE = this.isInternetExplorer;
    this.logicalThreads = this.determineGlobalThreads();
    this.Worker = this.locateWorkerObject();
    this.sharedWorker = this.locateSharedWorkerObject();
  }

  /**
  * @function determineGlobalThreads - Determines max number of threads to use
  */
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

  /**
  * @function locateWorkerObject - Attempts to find a global Worker object
  */
  locateWorkerObject() {
    return typeof Worker !== 'undefined' ? Worker : null;
  }

  /**
  * @function locateSharedWorkerObject - Attempts to find a global SharedWorker object
  */
  locateSharedWorkerObject() {
    return typeof SharedWorker !== 'undefined' ? SharedWorker : null;
  }

  /**
  * @function isBrowser - Detects if execution environment is a browser
  */
  isBrowser() {
    return typeof window === "object";
  }

  /**
  * @function isInternetExplorer - Detects if execution environment is internet explorer
  */
  isInternetExplorer(version) {
    return (new RegExp('msie' + (!isNaN(version) ? ('\\s'+version) : ''), 'i').test(navigator.userAgent));
  }

  /**
  * @function isNode - Detects if execution environment is node.js
  */
  isNode() {
    return typeof process === "object" && typeof require === "function" && !this.isBrowser() && !this.isWebWorker();
  }

  /**
  * @function isWebWorker - Detects if execution environment is a webworker
  */
  isWebWorker() {
    return typeof importScripts === "function";
  }

  /**
  * @function isReactNative - Detects if execution environment is reactNative
  */
  isReactNative() {
    return !this.isNode() && typeof global === 'object';
  }

  /**
  * @function isShell - Detects if execution environment is a shell
  */
  isShell() {
    return this.isBrowser() && !this.isNode() && !this.isWebWorker() && !this.isReactNative();
  }

  /**
  * @function isLegacyEnvironment - Detects if execution environment is a legacy environment
  */
  isLegacyEnvironment() {
    // Force legacy mode for known devices that don't support threading
    if (this.isBrowser() && !this.isReactNative()) {
      let isIE10 = this.isInternetExplorer(10);
      let userAgent = navigator.userAgent;
      let lacksWorkerSupport = (typeof this.Worker === 'undefined');
      let legacyAgents = ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'];
      if (lacksWorkerSupport || legacyAgents.indexOf(userAgent) !== -1 || isIE10) {
        this.legacy = true;
      }
    }
    // Detect sharedWorker support for use within webworkers
    if (this.isWebWorker() && typeof this.SharedWorker !== 'undefined') {
      try {
        let workerBlob = hamstersData.generateBlob();
        let SharedHamster = new this.SharedWorker(workerBlob, 'SharedHamsterWheel');
      } catch (e) {
        this.legacy = true;
      }
    }
    // Final check, if we're in a shell environment or we have no worker object use legacy mode
    if(!this.legacy) {
      return this.isShell() || !this.locateWorkerObject();
    }
  }

  /**
  * @function supportsTransferrableObjects - Detects if execution environment supports typed arrays
  */
  supportsTransferrableObjects() {
    return typeof Uint8Array !== 'undefined';
  }

  /**
  * @function supportsAtomicOperations - Detects if execution environment supports shared array buffers
  */
  supportsAtomicOperations() {
    return typeof SharedArrayBuffer !== 'undefined';
  }

  /**
  * @function supportsProxies - Detects if execution environment supports proxy objects
  */
  supportsProxies() {
    return typeof Proxy !== 'undefined';
  }
}

var hamstersHabitat = new habitat();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersHabitat;
}
