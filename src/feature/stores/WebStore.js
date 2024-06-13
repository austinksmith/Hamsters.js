class WebStore {
    constructor(dbName = 'hamstersjsMemoizeDB', storeName = 'cacheStore') {
        this.dbName = dbName;
        this.storeName = storeName;
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
                resolve(result ? result.value : null);
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

            const transaction = self.db.transaction([self.storeName], 'readwrite');
            const objectStore = transaction.objectStore(self.storeName);
            const request = objectStore.put({ key: key, value: value });

            request.onsuccess = function() {
                resolve();
            };

            request.onerror = function(event) {
                reject(event.target.error);
            };
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
}

module.exports = WebStore;