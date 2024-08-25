const path = require('path');

const webConfig = {
  target: 'web',
  devtool: 'source-map',
  context: path.resolve(__dirname, 'src'),
  entry: './hamsters',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'hamsters.web.min.js',
    library: {
      name: 'hamsters',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ["@babel/preset-env", {
                targets: "defaults" // Targets modern browsers with ES6+ support
              }]
            ]
          }
        }
      }
    ]
  }
};

const nodeConfig = {
  target: 'node',
  devtool: 'source-map',
  context: path.resolve(__dirname, 'src'),
  entry: './hamsters',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'hamsters.node.min.js',
    library: {
      name: 'hamsters',
      type: 'umd',
      export: 'default'
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: path.resolve(__dirname, 'src/core/wheel.js'),
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ["@babel/preset-env", {
                targets: "defaults" // Targets modern browsers with ES6+ support
              }]
            ]
          }
        }
      }
    ]
  }
};

module.exports = [webConfig, nodeConfig];
