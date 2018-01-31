/*
  Test path configuration file
 */
var testsContext = require.context('./spec', true, /.js$/);
testsContext.keys().forEach(testsContext);
