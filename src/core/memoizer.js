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

class memoizer {
  constructor() {
    this.maxCacheEntries = 25;
    this.cacheEntries = [];
    this.itemCached = this.isItemCached;
    this.fetchItem = this.fetchItemFromCache;
    this.saveItem = this.saveItemToCache;
  }

  isItemCached(input, method) {
  	return !!(this.fetchItem({fn: method, data: input})) || false;
  }

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

var hamsterMemoizer = new memoizer();

if(typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = hamsterMemoizer;
}
