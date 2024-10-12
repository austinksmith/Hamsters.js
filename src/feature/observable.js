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

  emitEvents(emitType, eventData) {
    if(emitType !== 'change') {
      this.emit(emitType, eventData);
    }
    this.emit('change', eventData);
  }

  set(key, value, emitType = 'change') {
    const isNewKey = !this.data[key];  // Check if it's a new entry

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

    this.emitEvents(emitType, this.data);

    return value;
  }

  setAll(data) {
    this.data = data;
  }

  get(key) {
    return this.data[key];
  }

  push(...items) {
    this.data.push(...items);
    this.emitEvents('change', this.data);
  }

  pop(emitType = 'change') {
    const item = this.data.pop();
    this.emitEvents(emitType, this.data);
    return item;
  }

  shift(emitType = 'change') {
    let item = this.data.shift();
    this.emitEvents(emitType, this.data);
    return item;
  }

  splice(start, deleteCount, ...items) {
    const result = this.data.splice(start, deleteCount, ...items);
    this.emitEvents('change', this.data);
    return result;
  }

  indexOf(item) {
    return this.data.indexOf(item);
  }

  length() {
    return this.data.length;
  }

  delete(property, emitType = 'change') {
    if (!Array.isArray(this.data)) {
      delete this.data[property];
      this.emitEvents(emitType, this.data);
    }
  }

  getData() {
    return this.data;
  }
}

export default Observable;
