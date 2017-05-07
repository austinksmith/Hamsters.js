  processData: (dataType, buffer) => {
    let types = {
      "uint32": Uint32Array,
      "uint16": Uint16Array,
      "uint8": Uint8Array,
      "uint8clamped": Uint8ClampedArray,
      "int32": Int32Array,
      "int16": Int16Array,
      "int8": Int8Array,
      "float32": Float32Array,
      "float64": Float64Array
    };
    if(!types[dataType]) {
      return dataType;
    }
    return new types[dataType](buffer);
  },

  processDataType: (dataType, buffer) => {
    if(this.env.transferrable) {
      return this.processData(dataType, buffer);
    }
    return buffer;
  },