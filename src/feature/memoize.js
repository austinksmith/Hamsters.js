import NodeStore from './stores/NodeStore';
import WebStore from './stores/WebStore';

class Memoize {
    constructor(hamsters, maxSize) {
        'use strict';

        this.hamsters = hamsters;
        this.store = this.hamsters.habitat.node ? new NodeStore(maxSize) : new WebStore('hamstersjs', 'cacheStore', maxSize);
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
        const key = JSON.stringify({ input: task.input });
        return this.hashCode(key);
    }

    hashCode(str) {
        let hash = 0, i, chr;
        if (str.length === 0) return hash;
        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash.toString();
    }

    applyFunc(func, args) {
        return new Promise((resolve, reject) => {
            try {
                const result = func.apply(null, args);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = Memoize;