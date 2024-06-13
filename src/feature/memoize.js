import NodeStore from './stores/NodeStore';
import WebStore from './stores/WebStore';

class Memoize {
    constructor(hamsters) {
        this.hamsters = hamsters;
        this.store = this.hamsters.habitat.node ? new NodeStore() : new WebStore();
    }

    memoize(func) {
        const self = this;
        return function() {
            const args = Array.prototype.slice.call(arguments);
            const key = JSON.stringify(args);

            return new Promise(function(resolve, reject) {
                self.store.get(key).then(function(cachedResult) {
                    if (cachedResult !== null) {
                        resolve(cachedResult);
                    } else {
                        self.applyFunc(func, args).then(function(result) {
                            self.store.set(key, result).then(function() {
                                resolve(result);
                            }).catch(reject);
                        }).catch(reject);
                    }
                }).catch(reject);
            });
        };
    }

    applyFunc(func, args) {
        const self = this;
        return new Promise(function(resolve, reject) {
            try {
                const result = func.apply(null, args);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }
}

export default Memoize;
