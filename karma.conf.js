const path = require('path');
const webpack = require('webpack');

module.exports = (config) => {
  config.set({
    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera (has to be installed with `npm install karma-opera-launcher`)
    // - Safari (only Mac; has to be installed with `npm install karma-safari-launcher`)
    // - PhantomJS
    // - IE (only Windows; has to be installed with `npm install karma-ie-launcher`)
    browsers: ['PhantomJS'],
    files: [
      {
        pattern: 'tests.webpack.js', 
        watched: true
      },
      'node_modules/babel-polyfill/dist/polyfill.js'
    ],
    frameworks: [
      'jasmine',
    ],
    preprocessors: {
      'tests.webpack.js': ['webpack'],
    },
    colors: true,
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,
    captureTimeout: 60000,
    singleRun: false,
    autoWatch: true,
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
    reporters: ['dots', 'progress', 'html', 'coverage', 'junit'],
    htmlReporter: {
      outputFile: 'report/jasmine.html',
      // Optional
      pageTitle: 'Hamsters.js Jasmine Output',
      subPageTitle: '',
      groupSuites: true,
      useCompactStyle: false,
      useLegacyStyle: false
    },
    webpack: {
      cache: false,
      plugins: webpack.plugins,
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
        ]
      }
    },
  });
};
