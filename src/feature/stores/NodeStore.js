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

module.exports = NodeStore;
