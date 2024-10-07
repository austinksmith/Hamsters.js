const path = require('path');
const webpack = require('webpack');

module.exports = (config) => {
  config.set({
    browsers: ['Chrome'],
    files: [
      {
        pattern: 'tests.webpack.js', 
        watched: true
      }
    ],
    frameworks: [
      'jasmine',
    ],
    preprocessors: {
      'tests.webpack.js': ['webpack'],
    },
    colors: true,
    logLevel: config.LOG_DEBUG,
    captureTimeout: 60000,
    singleRun: false,
    autoWatch: true,
    reporters: ['dots', 'progress', 'html', 'coverage', 'junit'],
    htmlReporter: {
      outputFile: 'report/jasmine.html',
      pageTitle: 'Hamsters.js Jasmine Output',
      groupSuites: true,
      useCompactStyle: false,
      useLegacyStyle: false
    },
    webpack: {
      cache: false,
      plugins: webpack.plugins, // Ensure this is defined correctly
      module: {
        rules: [
          {
            test: /\.js$/,
            exclude: path.resolve(__dirname, 'scaffold'),
            use: {
              loader: 'babel-loader',
              options: {
                presets: [
                  ["@babel/preset-env", {
                    targets: "defaults" // Targets modern browsers with ES6+ support
                  }]
                ]
              },
            },
          }
        ]
      }
    },
  });
};
