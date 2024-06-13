class NodeStore {
    constructor() {
        this.cache = {};
    }

    get(key) {
        return Promise.resolve(this.cache[key] || null);
    }

    set(key, value) {
        this.cache[key] = value;
        return Promise.resolve();
    }

    clear() {
        this.cache = {};
    }
}

export default NodeStore;