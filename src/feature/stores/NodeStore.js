/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class NodeStore {
    constructor(maxSize) {
        this.maxSize = maxSize;
        this.cache = new Map();
    }

    get(key) {
        if (this.cache.has(key)) {
            const value = this.cache.get(key);
            // Refresh the key
            this.cache.delete(key);
            this.cache.set(key, value);
            return Promise.resolve(value);
        }
        return Promise.resolve(null);
    }

    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            // Remove the oldest (least recently used) entry
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        this.cache.set(key, value);
        return Promise.resolve();
    }

    clear() {
        this.cache.clear();
        return Promise.resolve();
    }
}

export default NodeStore;
