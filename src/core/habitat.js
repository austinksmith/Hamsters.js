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
    this.browser = this.isBrowser();
    this.webWorker = this.isWebWorker();
    this.node = this.isNode();
    this.reactNative = this.isReactNative();
    this.shell = this.isShell();
    this.transferable = this.supportstransferableObjects();
    this.atomics = this.supportsAtomicOperations();
    this.proxies = this.supportsProxies();
    this.isIE10 = !this.isNode() && !this.isReactNative() && this.isInternetExplorer(10);
    this.hamsterWheel = this.selectHamsterWheel();
    this.sharedWorker = this.locateSharedWorkerObject();
    this.locateBlobBuilder = this.locateBlobBuilder;
    this.legacy = this.isLegacyEnvironment();
    this.legacyWheel = hamstersWheel.legacy;
    this.Worker = this.locateWorkerObject();
    this.maxThreads = this.determineGlobalThreads();
  }

  /**
  * @function determineGlobalThreads - Determines max number of threads to use
  */
  determineGlobalThreads() {
    let max = 4;
    if(this.browser && typeof navigator.hardwareConcurrency !== "undefined") {
      max = navigator.hardwareConcurrency;
      if(this.isFirefox()) {
        max = (max > 20 ? 20 : max);
      }
    }
    if(this.node && typeof os !== 'undefined') {
      max = os.cpus().length;
    }
    return max;
  }

  /**
  * @function isFireox - Detect firefox browser
  */
  isFirefox() {
    return (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1);
  }

  /**
  * @function locateWorkerObject - Attempts to find a global Worker object
  */
  locateWorkerObject() {
    return (typeof Worker !== 'undefined' ? Worker : false);
  }

  /**
  * @function locateSharedWorkerObject - Attempts to find a global SharedWorker object
  */
  locateSharedWorkerObject() {
    return (typeof SharedWorker !== 'undefined' ? SharedWorker : false);
  }

  /**
  * @function isBrowser - Detects if execution environment is a browser
  */
  isBrowser() {
    return (typeof window === "object");
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
    return (typeof process === "object" && typeof require === "function" && !this.isWebWorker() && !this.browser);
  }

  /**
  * @function isWebWorker - Detects if execution environment is a webworker
  */
  isWebWorker() {
    return (typeof importScripts === "function" && !this.isReactNative());
  }

  /**
  * @function isReactNative - Detects if execution environment is reactNative
  */
  isReactNative() {
    return (typeof navigator !== "undefined" && typeof navigator.product !== "undefined" && navigator.product == "ReactNative");
  }

  /**
  * @function isShell - Detects if execution environment is a shell
  */
  isShell() {
    return ((typeof navigator === "undefined") && !this.isNode() && !this.isWebWorker() && !this.isReactNative());
  }

  /**
  * @function isLegacyEnvironment - Detects if execution environment is a legacy environment
  */
  isLegacyEnvironment() {
    let isLegacy = !!!this.Worker;
    // Detect sharedWorker support for use within webworkers
    if (this.isWebWorker() && typeof this.SharedWorker !== 'undefined') {
      isLegacy = !this.supportsSharedWorkers();
    }
    return isLegacy;
  }

  supportsSharedWorkers() {
    let supports = false;
    try {
      let workerBlob = this.generateWorkerBlob(this.hamsterWheel);
      let SharedHamster = new this.SharedWorker(workerBlob, 'SharedHamsterWheel');
      supports = true;
    } catch (e) {
      supports = false;
    }
    return supports;
  }

  /**
  * @function createDataBlob - Attempts to locate data blob builder, vender prefixes galore
  */
  locateBlobBuilder() {
    if(typeof BlobBuilder !== 'undefined') {
      return BlobBuilder;
    }
    if(typeof WebKitBlobBuilder !== 'undefined') {
      return WebKitBlobBuilder;
    }
    if(typeof MozBlobBuilder !== 'undefined') {
      return MozBlobBuilder;
    }
    if(typeof MSBlobBuilder !== 'undefined') {
      return MSBlobBuilder;
    }
    return 'Environment does not support data blobs!';
  }

  /**
  * @function createDataBlob - Creates new data blob from textContent
  * @param {string} textContent - Provided text content for blob
  */
  createDataBlob(textContent) {
    if(typeof Blob === 'undefined') {
      let BlobMaker = this.locateBlobBuilder();
      let blob = new BlobMaker();
      blob.append([textContent], {
        type: 'application/javascript'
      });
      return blob.getBlob();
    }
    return new Blob([textContent], {
      type: 'application/javascript'
    });
  }

  /**
  * @function generateWorkerBlob - Creates blob uri for flexible scaffold loading
  * @param {function} workerLogic - Scaffold to use within worker thread
  */
  generateWorkerBlob(workerLogic) {
    return  URL.createObjectURL(this.createDataBlob('(' + String(workerLogic) + ')();'));
  }

  /**
  * @function supportstransferableObjects - Detects if execution environment supports typed arrays
  */
  supportstransferableObjects() {
    return (typeof Uint8Array !== 'undefined');
  }

  /**
  * @function supportsAtomicOperations - Detects if execution environment supports shared array buffers
  */
  supportsAtomicOperations() {
    return (typeof SharedArrayBuffer !== 'undefined');
  }

  /**
  * @function supportsProxies - Detects if execution environment supports proxy objects
  */
  supportsProxies() {
    return (typeof Proxy !== 'undefined');
  }

  /**
  * @function scheduleTask - Determines which scaffold to use for proper execution for various environments
  */
  selectHamsterWheel() {
    if(this.isIE10) {
      return '../common/internetExplorer.js';
    }
    if(this.reactNative) {
      return './reactNativeHamster.js';
    }
    if (this.node) {
      return './node_modules/hamsters.js/build/common/node.js';
    }
    return this.generateWorkerBlob(hamstersWheel.regular);
  }
}

var hamstersHabitat = new habitat();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersHabitat;
}
