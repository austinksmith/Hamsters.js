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

class memoizer {
  
  /**
  * @constructor
  * @function constructor - Sets properties for this class
  */
  constructor() {
    this.maxCacheEntries = 25;
    this.cacheEntries = [];
    this.itemCached = this.isItemCached;
    this.fetchItem = this.fetchItemFromCache;
    this.saveItem = this.saveItemToCache;
  }

  /**
  * @function isItemCached - Checks for existing data in cache
  * @param {object} input - Provided library execution options
  * @param {method} functionToRun - Function to execute
  * @return {object} Execution results from cache, or false
  */
  isItemCached(input, method) {
  	return !!(this.fetchItem({fn: method, data: input})) || false;
  }

  /**
  * @function fetchItemFromCache - Fetches cache item from cache
  * @param {object} cacheItem - Cache item to fetch
  * @return {object} CacheResults, or false
  */
  fetchItemFromCache(cacheItem) {
  	let cachedResult = null;
  	for(var key in this.cache) {
  		if(this.cache.hasOwnProperty(key)) {
  			if(cacheItem[key].fn === cacheItem.fn) {
  				if(cacheItem[key].input === cacheItem.data) {
  					cachedResult = cacheItem[key].input;
  				}
  			}
  		}
  	}
  	return cachedResult || false;
  }

  /**
  * @function isItemCached - Checks for existing data in cache
  * @param {method} functionToRun - Function to execute
  * @param {object} data - Execution results to cache
  */
  saveItemToCache(method, data, maxCacheEntries) {
  	let itemToCache = {
  		fn: method,
  		input: data
  	};
  	let cachedItems = this.cacheEntries;
  	if(cachedItems.length < maxCacheEntries) {
  		cachedItems.push(itemToCache);
  	} else {
  		cachedItems.splice(0, 0, itemToCache); 
  	}
  	this.cacheEntries = cachedItems;
  }
}

var hamstersMemoizer = new memoizer();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamstersMemoizer;
}
