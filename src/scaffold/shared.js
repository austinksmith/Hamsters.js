/* jshint esversion: 6, curly: true, eqeqeq: true, forin: true */

/***********************************************************************************
* Title: Hamsters.js                                                               *
* Description: 100% Vanilla Javascript Multithreading & Parallel Execution Library *
* Author: Austin K. Smith                                                          *
* Contact: austin@asmithdev.com                                                    *  
* Copyright: 2015 Austin K. Smith - austin@asmithdev.com                           * 
* License: Artistic License 2.0                                                    *
***********************************************************************************/

class Shared {

    /**
    * @constructor
    * @function constructor - Sets properties for this class
    */
    constructor() {
      this.scaffold = this.workerScaffold;
    }
  
    /**
    * @function workerScaffold - Provides worker body for library functionality when used within a worker [threads inside threads]
    */
    workerScaffold() {
      self.params = {};
      self.rtn = {};
  
      addEventListener('connect', (incomingConnection) => {
        var port = incomingConnection.ports[0];
        port.start();
        port.addEventListener('message', (incomingMessage) => {
          this.params = incomingMessage.data;
          this.rtn = {
            data: [],
            dataType: this.params.dataType
          };
          eval("(" + this.params.hamstersJob + ")")();
          port.postMessage(this.rtn);
        }, false);
      }, false);
    }
  }
  
  export default Shared;
  