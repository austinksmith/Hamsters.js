class Regular {

    /**
    * @constructor
    * @function constructor - Sets properties for this class
    */
    constructor() {
        this.scaffold = function() {
            self.params = {};
            self.rtn = {};

            self.onmessage = function (message) {
                this.params = message.data;
                this.rtn = {
                    data: [],
                    dataType: (typeof this.params.dataType !== 'undefined' ? this.params.dataType : null),
                    index: this.params.index
                };
                if (this.params.sharedBuffer) {
                    this.params.sharedArray = typedArrayFromBuffer(this.params.dataType, this.params.sharedBuffer);
                }
                eval(this.params.hamstersJob);
                const buffers = handleDataType(this.rtn);
                returnResponse(this.rtn, buffers);
            }.bind(this);

            function handleDataType(rtn) {
                if (this.params.sharedArray) {
                    // Do nothing here, we don't need to return a buffer rtn.data is useless here
                } else if (this.params.dataType) {
                    rtn.data = typedArrayFromBuffer(rtn.dataType, rtn.data);
                }
                return getTransferableObjects(rtn); // Return transferable objects
            }

            function typedArrayFromBuffer(dataType, buffer) {
                const types = {
                    'Uint32': Uint32Array,
                    'Uint16': Uint16Array,
                    'Uint8': Uint8Array,
                    'Uint8clamped': Uint8ClampedArray,
                    'Int32': Int32Array,
                    'Int16': Int16Array,
                    'Int8': Int8Array,
                    'Float32': Float32Array,
                    'Float64': Float64Array
                };
                return types[dataType] ? new types[dataType](buffer) : buffer;
            }

            function returnResponse(rtn, buffers) {
                if (buffers && buffers.length > 0) {
                    postMessage(rtn, buffers);  // PostMessage with transferable objects
                } else {
                    postMessage(rtn);  // PostMessage without transferable objects
                }
            }

            function getTransferableObjects(obj) {
                const transferableObjects = new Set();
                const typedArrayTypes = [
                    'Int32Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array',
                    'Uint16Array', 'Uint32Array', 'Float32Array', 'Float64Array'
                ];
                const otherTransferables = [
                    'ArrayBuffer', 'MessagePort', 'ImageBitmap', 'OffscreenCanvas'
                ];

                const globalContext = typeof self !== 'undefined' ? self : window;

                const allTypes = [...typedArrayTypes, ...otherTransferables];

                for (const prop in obj) {
                    if (obj.hasOwnProperty(prop)) {
                        for (const type of allTypes) {
                            if (typeof globalContext[type] !== 'undefined' && obj[prop] instanceof globalContext[type]) {
                                if (typedArrayTypes.includes(type)) {
                                    transferableObjects.add(obj[prop].buffer);
                                } else {
                                    transferableObjects.add(obj[prop]);
                                }
                            }
                        }
                    }
                }

                return Array.from(transferableObjects);
            }
        }
    }
}

export default Regular;
