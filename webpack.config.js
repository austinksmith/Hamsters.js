const path = require('path');
const webpack = require('webpack');


var browser = {
  target: 'web',
  devtool: 'sourcemap',
  entry: [
    './src/hamsters',
  ],
  output: {
    path: path.resolve('./build'),
    filename: 'hamsters.min.js',
    library: 'hamsters',
    libraryTarget: 'var'
  },
  module: {
    loaders: [
      {
        test: [/\.js?$/],
        exclude: path.resolve(__dirname, 'node_modules'),
        loader: 'babel',
        query: {
          presets: ['es2015'],
        },
      }
    ],
  }
};

// var server = {
//   target: 'node',
//   devtool: 'sourcemap',
//   entry: [
//     './src/hamsters',
//   ],
//   output: {
//     path: path.resolve('./build'),
//     filename: 'hamsters.node.min.js',
//     library: 'hamsters',
//     libraryTarget: 'var'
//   },
//   module: {
//     loaders: [
//       {
//         test: [/\.js?$/],
//         exclude: path.resolve(__dirname, 'node_modules'),
//         loader: 'babel',
//         query: {
//           presets: ['es2015'],
//         },
//       }
//     ],
//   }
// };

module.exports = [
  browser
];