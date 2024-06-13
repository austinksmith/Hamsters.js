import NodeStore from './stores/NodeStore';
import WebStore from './stores/WebStore';

class Memoize {
    constructor(hamsters) {
        this.hamsters = hamsters;
        this.store = this.hamsters.habitat.node ? new NodeStore() : new WebStore();
    }

    memoize(func) {
        const self = this;
        return function(task) {
            const key = self.generateTaskKey(task);

            return new Promise(function(resolve, reject) {
                self.store.get(key).then(function(cachedResult) {
                    if (cachedResult !== null) {
                        resolve(cachedResult);
                    } else {
                        self.applyFunc(func, task).then(function(result) {
                            self.store.set(key, result).then(function() {
                                resolve(result);
                            }).catch(reject);
                        }).catch(reject);
                    }
                }).catch(reject);
            });
        };
    }

    generateTaskKey(task) {
        const key = JSON.stringify({
            input: task.input
        });
        return this.hashCode(key);
    }

    applyFunc(func, task) {
        const self = this;
        return new Promise(function(resolve, reject) {
            try {
                const result = func(task);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    hashCode(str) {
        let hash = 0;
        if (str.length === 0) {
            return hash;
        }
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    }
}

export default Memoize;
