/*
  Test path configuration file
 */
var testsContext = require.context('./tests', true, /.js$/);
testsContext.keys().forEach(testsContext);
