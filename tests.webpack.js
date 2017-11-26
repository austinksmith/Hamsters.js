/*
  Test path configuration file
 */
var testsContext = require.context('./spec', true, /Spec\.js$/);
testsContext.keys().forEach(testsContext);
