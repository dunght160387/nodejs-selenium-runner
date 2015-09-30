var assert = require('assert')
  , soda = require('soda')
  , seleniumRunner = require('../lib/selenium-runner');

describe("sanity", function(){

  it("should be sane", function(done){
    seleniumRunner(function(er, selenium) {
      if (er) return done(er);
      selenium.on('exit', function() { done() });

      soda.createClient({
        url: 'http://www.facebook.com/',
        host: selenium.host,
        port: selenium.port
      })
      .chain
      .session()
      .setTimeout(5000)
      .open('/')
      .waitForPageToLoad(2000)
      .waitForTextPresent('Email')
      .assertTextPresent('Email')
      .testComplete()
      .end(function() {
        selenium.kill()
      })
    })
  });


  it('should get the server port from the node environment', function(done) {
    process.env.SELENIUM_RUNNER_PORT = '4444';
    seleniumRunner(function(er, selenium) {
      delete process.env.SELENIUM_RUNNER_PORT;
      if (er) return done(er);
      assert.equal(selenium.port, 4444);
      selenium.on('exit', function() { done() });
      selenium.kill()
    })
  });

});
