
"use strict";


const processDataType = require("../../wheel/data/process-data").processDataType;

module.exports = (input, dataType) => {
  if(!dataType || !hamsters.wheel.env.transferrable) {
    return input.reduce((a, b) => a.concat(b));
  }
  let i = 0;
  let len = input.length;
  let bufferLength = 0;
  for (i; i < len; i += 1) {
    bufferLength += input[i].length;
  }
  let output = processDataType(dataType, bufferLength);
  let offset = 0;
  for (i = 0; i < len; i += 1) {
    output.set(input[i], offset);
    offset += input[i].length;
  }
  return output;
};