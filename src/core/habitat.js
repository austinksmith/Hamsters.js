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

import hamstersData from './data';
import hamstersWheel from './wheel';

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
    this.legacy = this.isLegacyEnvironment();
    this.legacyWheel = hamstersWheel.legacy,
    this.browser = this.isBrowser();
    this.webWorker = this.isWebWorker();
    this.node = this.isNode();
    this.reactNative = this.isReactNative();
    this.shell = this.isShell();
    this.transferrable = this.supportsTransferrableObjects();
    this.atomics = this.supportsAtomicOperations();
    this.proxies = this.supportsProxies();
    this.isIE10 = !this.isNode() && !this.isReactNative() && this.isInternetExplorer(10);
    this.logicalThreads = this.determineGlobalThreads();
    this.Worker = this.locateWorkerObject();
    this.sharedWorker = this.locateSharedWorkerObject();
    this.selectHamsterWheel = this.selectHamsterWheel;
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
    if(this.node && typeof os !== 'undefined') {
      max = os.cpus().length;
    }
    return max;
  }

  /**
  * @function locateWorkerObject - Attempts to find a global Worker object
  */
  locateWorkerObject() {
    return typeof Worker !== 'undefined' ? Worker : false;
  }

  /**
  * @function locateSharedWorkerObject - Attempts to find a global SharedWorker object
  */
  locateSharedWorkerObject() {
    return typeof SharedWorker !== 'undefined' ? SharedWorker : false;
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
    return typeof process === "object" && typeof require === "function" && !this.isWebWorker() && !this.browser;
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
    return !this.isNode() && typeof global === 'object' && !this.browser;
  }

  /**
  * @function isShell - Detects if execution environment is a shell
  */
  isShell() {
    return this.browser && !this.isNode() && !this.isWebWorker() && !this.isReactNative();
  }

  /**
  * @function isLegacyEnvironment - Detects if execution environment is a legacy environment
  */
  isLegacyEnvironment() {
    let isLegacy = false;
    // Force legacy mode for known devices that don't support threading
    if (this.browser && !this.isReactNative()) {
      isLegacy = this.isLegacyDevice();
    }
    // Detect sharedWorker support for use within webworkers
    if (this.isWebWorker() && typeof this.SharedWorker !== 'undefined') {
      isLegacy = !this.supportsSharedWorkers();
    }
    return isLegacy || !!!this.locateWorkerObject();
  }

  isLegacyDevice() {
    let legacyDevice = false;
    let userAgent = navigator.userAgent;
    let lacksWorkerSupport = (typeof this.Worker === 'undefined');
    let legacyAgents = ['Kindle/3.0', 'Mobile/8F190', 'IEMobile'];
    if (lacksWorkerSupport || legacyAgents.indexOf(userAgent) !== -1) {
      legacyDevice = true;
    }
    return legacyDevice;
  }

  supportsSharedWorkers() {
    let supports = false;
    try {
      let workerBlob = hamstersData.generateBlob();
      let SharedHamster = new this.SharedWorker(workerBlob, 'SharedHamsterWheel');
      supports = true;
    } catch (e) {
      supports = false;
    }
    return supports;
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

  /**
  * @function scheduleTask - Determines which scaffold to use for proper execution for various environments
  */
  selectHamsterWheel() {
    if(this.isIE10) {
      return './common/hamstersWheel.js';
    }
    if(this.reactNative) {
      return './common/rnHamstersWheel.js';
    }
    if(this.webWorker) {
      return hamstersWheel.worker;
    }
    if (this.node) {
      return hamstersWheel.regular;
    }
    return hamstersData.generateWorkerBlob(hamstersWheel.regular);
  }
}

var hamstersHabitat = new habitat();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersHabitat;
}
