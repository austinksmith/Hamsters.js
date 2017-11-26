karma-htmlfile-reporter
=======================

## A karma plugin for exporting unit test results as styled HTML file

This is a plugin for the [Karma Test Runner]. By adding this reporter to your karma configuration, unit test results will be exported as a styled HTML file. For each test browser, a separate table is generated. The plugin is  based on the [karma-junit-reporter plugin].

<img src="http://matthias-schuetz.github.io/karma-htmlfile-reporter/karma-htmlfile-reporter.png?2" />

## HTML test result page
Version 0.3 comes with a fresh style from [David G Chung](https://github.com/davidc4747). You can see a preview of the exported unit test result page [here](http://matthias-schuetz.github.io/karma-htmlfile-reporter/units.html). A new option called *groupSuites* will group separate suites (*describe* blocks in test files) visually, see an example output [here](http://matthias-schuetz.github.io/karma-htmlfile-reporter/units_groups.html). You can also set the option *useCompactStyle* to *true* to export a more compact HTML output. The legacy page style is online [here](http://matthias-schuetz.github.io/karma-htmlfile-reporter/units_legacy.html). If you want to use the legacy style, you can set the option *useLegacyStyle* to *true*.

## Installation

The easiest way is to keep `karma-htmlfile-reporter` as a devDependency in your `package.json`.
```json
{
  "devDependencies": {
    "karma": "~0.10",
    "karma-htmlfile-reporter": "~0.3"
  }
}
```

You can simple do it by:
```bash
npm install karma-htmlfile-reporter --save-dev
```

It may also be necessary to install globally:
```bash
npm install -g karma-htmlfile-reporter
```

## Configuration
```js
// karma.conf.js
module.exports = function(config) {
  config.set({
    reporters: ['progress', 'html'],

    htmlReporter: {
      outputFile: 'tests/units.html',
			
      // Optional
      pageTitle: 'Unit Tests',
      subPageTitle: 'A sample project description',
	  groupSuites: true,
	  useCompactStyle: true,
      useLegacyStyle: true
    }
  });
};
```

You can pass list of reporters as a CLI argument too:
```bash
karma start --reporters html
```

----

For more information on Karma see the [homepage].

[Karma Test Runner]: https://github.com/karma-runner/karma
[karma-junit-reporter plugin]: https://github.com/karma-runner/karma-junit-reporter
[homepage]: http://karma-runner.github.com