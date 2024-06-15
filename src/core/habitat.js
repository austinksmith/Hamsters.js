/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class Habitat {

  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor(hamsters) {
    'use strict';

    this.hamsters = hamsters;
    this.debug = false;
    this.importScripts = null;
    this.memoize = false;
    this.persistence = true;
    this.browser = this.isBrowser();
    this.webWorker = this.isWebWorker();
    this.node = this.isNode();
    this.reactNative = this.isReactNative();
    this.shell = this.isShell();
    this.transferable = this.supportsTransferableObjects();
    this.atomics = this.supportsAtomicOperations();
    this.proxies = this.supportsProxies();
    this.isIE = this.isInternetExplorer();
    this.selectHamsterWheel = this.selectHamsterWheel.bind(this);
    this.sharedWorker = this.locateSharedWorkerObject();
    this.locateBlobBuilder = this.findAvailableBlobBuilder();
    this.legacy = this.isLegacyEnvironment();
    this.Worker = this.locateWorkerObject();
    this.maxThreads = this.determineGlobalThreads();
    this.keys = this.getHabitatKeys();
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
  * @function isFirefox - Detect firefox browser
  */
  isFirefox() {
    if(typeof navigator !== "undefined" && typeof navigator.userAgent !== "undefined") {
      return (navigator.userAgent.toLowerCase().indexOf('firefox') !== -1);
    }
    return false;
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
  isInternetExplorer() {
    if(typeof navigator !== "undefined" && typeof navigator.userAgent !== "undefined") {
      return (navigator.userAgent.indexOf("MSIE ") !== -1 || navigator.userAgent.indexOf("Trident/") !== -1);
    }
    return false;
  }

  /**
  * @function isNode - Detects if execution environment is node.js
  */
  isNode() {
    return (typeof process === "object" && typeof require === "function" && !this.isWebWorker() && !this.browser);
  }

  /**
  * @function isWebWorker - Detects if execution environment is a web worker
  */
  isWebWorker() {
    return (typeof importScripts === "function" && !this.isReactNative());
  }

  /**
  * @function isReactNative - Detects if execution environment is React Native
  */
  isReactNative() {
    return (typeof navigator !== "undefined" && typeof navigator.product !== "undefined" && navigator.product === "ReactNative");
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

  /**
  * @function supportsSharedWorkers - Detects if execution environment supports SharedWorkers
  */
  supportsSharedWorkers() {
    let supports = false;
    try {
      let workerBlob = this.generateWorkerBlob(this.selectHamsterWheel());
      let SharedHamster = new this.SharedWorker(workerBlob, 'SharedHamsterWheel');
      supports = true;
    } catch (e) {
      supports = false;
    }
    return supports;
  }

  /**
  * @function findAvailableBlobBuilder - Attempts to locate a data blob builder, with vendor prefixes
  */
  findAvailableBlobBuilder() {
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
  * @function createDataBlob - Creates a new data blob from textContent
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
  * @function generateWorkerBlob - Creates a blob URI for flexible scaffold loading
  * @param {function} workerLogic - Scaffold to use within worker thread
  */
  generateWorkerBlob(workerLogic) {
    return  URL.createObjectURL(this.createDataBlob('(' + String(workerLogic) + ')();'));
  }

  /**
  * @function supportsTransferableObjects - Detects if execution environment supports typed arrays
  */
  supportsTransferableObjects() {
    return (typeof Uint8Array !== 'undefined');
  }

  /**
  * @function supportsAtomicOperations - Detects if execution environment supports SharedArrayBuffers
  */
  supportsAtomicOperations() {
    return (typeof SharedArrayBuffer !== 'undefined');
  }

  /**
  * @function supportsProxies - Detects if execution environment supports Proxy objects
  */
  supportsProxies() {
    return (typeof Proxy !== 'undefined');
  }

  /**
  * @function selectHamsterWheel - Determines which scaffold to use for proper execution for various environments
  */
  selectHamsterWheel() {
    if(this.isIE) {
      return this.hamsters.wheel.legacy;
    }
    if(this.reactNative) {
      return 'reactNativeHamster.js';
    }
    if (this.node) {
      return './node_modules/hamsters.js/build/common/node.js';
    }
    return this.generateWorkerBlob(this.hamsters.wheel.regular);
  }

  /**
  * @function getHabitatKeys - Returns keys for this Habitat instance
  */
  getHabitatKeys() {
    return [
      'worker','sharedworker',
      'legacy','proxies',
      'reactnative','atomics',
      'transferable','browser',
      'shell','node','debug',
      'persistence','importscripts',
      'maxthreads', 'parentport',
      'webworker',
    ];
  }
}

module.exports = Habitat;