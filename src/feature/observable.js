/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class Observable {
  constructor(initialData = {}) {
    this.data = Array.isArray(initialData) ? [...initialData] : { ...initialData };
    this.events = {};
  }

  // Allow listeners to register for specific events
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  // Notify listeners about the event
  emit(event, ...args) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }

  set(key, value) {
    if (typeof key === 'string') {
        const keys = key.split('.');
        let current = this.data;
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    } else if (typeof key === 'object') {
      this.data[key] = value;
    }
    this.emit('change', this.data);
  }

  get(key) {
    return this.data[key];
  }

  push(...items) {
    if (Array.isArray(this.data)) {
      this.data.push(...items);
      this.emit('change', this.data);
    }
  }

  pop() {
    if (Array.isArray(this.data)) {
      const item = this.data.pop();
      this.emit('change', this.data);
      return item;
    }
  }

  splice(start, deleteCount, ...items) {
    const result = this.data.splice(start, deleteCount, ...items);
    this.emit('change', this.data);
    return result;
  }

  indexOf(item) {
    return this.data.indexOf(item);
  }

  length() {
    return this.data.length;
  }

  delete(property) {
    if (!Array.isArray(this.data)) {
      delete this.data[property];
      this.emit('change', this.data);
    }
  }

  // Get current data
  getData() {
    return this.data;
  }
}

export default Observable;
