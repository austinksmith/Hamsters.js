/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class WebStore {
    constructor(dbName, storeName, maxSize) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.maxSize = maxSize;
        this.db = null;
        this.initDB();
    }

    initDB() {
        const self = this;
        const request = indexedDB.open(this.dbName, 1);

        request.onerror = function(event) {
            console.error('Error opening database:', event.target.error);
        };

        request.onupgradeneeded = function(event) {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(self.storeName)) {
                const objectStore = db.createObjectStore(self.storeName, { keyPath: 'key' });
                objectStore.createIndex('by_key', 'key', { unique: true });
                objectStore.createIndex('by_timestamp', 'timestamp');
            }
        };

        request.onsuccess = function(event) {
            self.db = event.target.result;
        };
    }

    get(key) {
        const self = this;
        return new Promise(function(resolve, reject) {
            if (!self.db) {
                console.error('Database not initialized');
                resolve(null);
                return;
            }

            const transaction = self.db.transaction([self.storeName], 'readonly');
            const objectStore = transaction.objectStore(self.storeName);
            const request = objectStore.get(key);

            request.onsuccess = function(event) {
                const result = event.target.result;
                if (result) {
                    self.updateTimestamp(key).then(() => resolve(result.value)).catch(reject);
                } else {
                    resolve(null);
                }
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    }

    set(key, value) {
        const self = this;
        return new Promise(function(resolve, reject) {
            if (!self.db) {
                console.error('Database not initialized');
                resolve();
                return;
            }

            self.checkSize().then(() => {
                const transaction = self.db.transaction([self.storeName], 'readwrite');
                const objectStore = transaction.objectStore(self.storeName);
                const request = objectStore.put({ key: key, value: value, timestamp: Date.now() });

                request.onsuccess = function() {
                    resolve();
                };

                request.onerror = function(event) {
                    reject(event.target.error);
                };
            }).catch(reject);
        });
    }

    clear() {
        const self = this;
        return new Promise(function(resolve, reject) {
            if (!self.db) {
                console.error('Database not initialized');
                resolve();
                return;
            }

            const transaction = self.db.transaction([self.storeName], 'readwrite');
            const objectStore = transaction.objectStore(self.storeName);
            const request = objectStore.clear();

            request.onsuccess = function() {
                resolve();
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    }

    checkSize() {
        const self = this;
        return new Promise(function(resolve, reject) {
            const transaction = self.db.transaction([self.storeName], 'readonly');
            const objectStore = transaction.objectStore(self.storeName);
            const countRequest = objectStore.count();

            countRequest.onsuccess = function() {
                const count = countRequest.result;
                if (count >= self.maxSize) {
                    self.evictOldest().then(resolve).catch(reject);
                } else {
                    resolve();
                }
            };

            countRequest.onerror = function(event) {
                reject(event.target.error);
            };
        });
    }

    evictOldest() {
        const self = this;
        return new Promise(function(resolve, reject) {
            const transaction = self.db.transaction([self.storeName], 'readwrite');
            const objectStore = transaction.objectStore(self.storeName);
            const index = objectStore.index('by_timestamp');
            const request = index.openCursor(null, 'next');

            request.onsuccess = function(event) {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete().onsuccess = function() {
                        resolve();
                    };
                } else {
                    resolve();
                }
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    }

    updateTimestamp(key) {
        const self = this;
        return new Promise(function(resolve, reject) {
            const transaction = self.db.transaction([self.storeName], 'readwrite');
            const objectStore = transaction.objectStore(self.storeName);
            const request = objectStore.get(key);

            request.onsuccess = function(event) {
                const data = event.target.result;
                if (data) {
                    data.timestamp = Date.now();
                    objectStore.put(data).onsuccess = function() {
                        resolve();
                    };
                } else {
                    resolve();
                }
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    }
}

export default WebStore;
