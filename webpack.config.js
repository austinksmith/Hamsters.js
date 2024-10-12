const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

const commonConfig = {
  devtool: 'source-map',
  context: path.resolve(__dirname, 'src'),
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({
      terserOptions: {
        ecma: 2015,
        compress: {
          dead_code: true,
          drop_debugger: true,
          conditionals: true,
          evaluate: true,
          booleans: true,
          loops: true,
          unused: true,
          hoist_funs: true,
          keep_fargs: false,
          hoist_vars: true,
          if_return: true,
          join_vars: true,
          side_effects: true,
          warnings: false,
        },
        mangle: {
          properties: {
            regex: /^_/,
          },
        },
        format: {
          comments: false,
        },
      },
      extractComments: false,
    })],
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
                targets: "defaults",
                modules: false
              }]
            ]
          }
        }
      }
    ]
  }
};

const webConfig = {
  ...commonConfig,
  target: 'web',
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
};

const nodeConfig = {
  ...commonConfig,
  target: 'node',
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
        ...commonConfig.module.rules[0],
        exclude: path.resolve(__dirname, 'src/core/wheel.js'),
      }
    ]
  }
};

module.exports = [webConfig, nodeConfig];