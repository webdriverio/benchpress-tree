var httpServer = require('http-server');
var webdriverio = require('webdriverio');
var benchpress = require('@christian-bromann/benchpress');
var depth = 11;

/**
 * initialize client
 */
var client = global.browser = webdriverio.remote({
  desiredCapabilities: {
    browserName: 'chrome',
    chromeOptions: {
      //Important for benchpress to get timeline data from the browser
      'args': ['--js-flags=--expose-gc'],
      'perfLoggingPrefs': {
        'traceCategories': 'v8,blink.console,devtools.timeline'
      }
    },
    loggingPrefs: {
      performance: 'ALL'
    }
  }
});

/**
 * initialize benchpress
 */
var runner = new benchpress.Runner([
  //use protractor as Webdriver client
  benchpress.WebdriverIOAdapter.WEBDRIVERIO_PROVIDERS,
  //use RegressionSlopeValidator to validate samples
  {provide: benchpress.Validator, useExisting: benchpress.RegressionSlopeValidator},
  //use 10 samples to calculate slope regression
  {provide: benchpress.RegressionSlopeValidator.SAMPLE_SIZE, useValue: 20},
  //use the script metric to calculate slope regression
  {provide: benchpress.RegressionSlopeValidator.METRIC, useValue: 'scriptTime'},
  {provide: benchpress.Options.FORCE_GC, useValue: true}
]);

/**
 * start server
 */
httpServer.createServer({
  showDir: false
}).listen('8080', 'localhost');

client
  .init()
  //Load the benchmark, with a tree depth of 11
  .url('http://localhost:8080/tree.html?depth=' + depth)
  .call(function () {
    /*
     * Tell benchpress to click the buttons to destroy and re-create the tree for each sample.
     * Benchpress will log the collected metrics after each sample is collected, and will stop
     * sampling as soon as the calculated regression slope for last 20 samples is stable.
     */
    return runner.sample({
      id: 'deep-tree',
      execute: function() {
        /*
         * Will call querySelector in the browser, but benchpress is smart enough to ignore injected
         * script.
         */
        return client.click('#destroyDom').then(function () {
          return client.click('#createDom');
        });
      },
      providers: [{
        provide: benchpress.Options.SAMPLE_DESCRIPTION,
        useValue: { depth: depth }
      }]
    });
  })
  .end()
