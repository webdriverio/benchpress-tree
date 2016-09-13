var httpServer = require('http-server');

exports.config = {
  capabilities: [{
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
  }],

  specs: ['tree_benchmark.spec.js'],
  framework: 'mocha',

  onPrepare: function () {
    httpServer.createServer({
      showDir: false
    }).listen('8080', 'localhost');
  },

  mochaOpts: {
    timeout: 30000
  },

  // start selenium standalone server before start
  services: ['selenium-standalone']
};
