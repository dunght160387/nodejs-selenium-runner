var fs = require('fs')
    , path = require('path')
    , request = require('request')
    , spawn = require('child_process').spawn
    , freeport = require('freeport')
    , EventEmitter = require('events').EventEmitter
    , util = require('util')
    , portscanner = require('portscanner');

var override = process.env.SELENIUM_VERSION ? process.env.SELENIUM_VERSION.split(':') : []
    , version = override[0] || '2.45.0'
    , filename = 'selenium-server-standalone-' + version + '.jar'
    , url = 'http://selenium-release.storage.googleapis.com/' + version.replace(/.\d$/, '') + '/' + filename
    , outfile = path.join(path.dirname(__filename), filename);

/**
 * download selenium-server-standalone-<version>.jar
 * @param url
 * @param outfile
 * @param cb
 */
function download(url, outfile, cb) {
    var real = function () {
        console.log('Downloading Selenium ' + version);
        console.log('From: ' + url);
        var i = 0;
        var requestOptions = {url: url};
        if (process.env.http_proxy != null) {
            requestOptions.proxy = process.env.http_proxy;
        }
        request(requestOptions)
            .on('end', function () {
                process.stdout.write('\n');
                cb()
            })
            .on('data', function () {
                if (i == 8000) {
                    process.stdout.write('\n');
                    i = 0
                }
                if (i % 100 === 0) process.stdout.write('.');
                i++
            })
            .pipe(fs.createWriteStream(outfile))
    };

    fs.stat(outfile, function (er, stat) {
        if (er) return real();
        cb()
    })
}

/**
 * Run Selenium server with port
 * @param host
 * @param port
 * @param cb
 */
function runSelenium(host, port, cb) {
    console.log('Starting Selenium ' + version + ' on port ' + port);
    console.log('Filename: ' + outfile);

    var child = spawn('java', [
        '-jar', outfile,
        '-port', port
    ]);

    console.log('runSelenium: ' + host + ':' + port);
    child.host = host;
    child.port = port;

    var badExit = function () {
        cb(new Error('Could not start Selenium.'))
    };

    child.stderr.on('data', function (data) {
        var sentinal = 'Started org.openqa.jetty.jetty.Server';

        if (data.toString().indexOf(sentinal) != -1) {
            child.removeListener('exit', badExit);
            cb(null, child)
        }
    });

    child.on('exit', badExit)
}

/**
 * Run Selenium server on a defined port
 * @param host
 * @param port
 * @param cb
 */
function runOnDefinedPort(host, port, cb) {
    portscanner.checkPortStatus(port, '127.0.0.1', function(error, status) {
        // Status is 'open' if currently in use or 'closed' if available
        console.log('port ' + port + ' is ' + status);

        if(status === 'open'){
            console.log('SELENIUM_RUNNER_PORT is currently opened => create FakeProcess');
            return process.nextTick(
                cb.bind(null, null, new FakeProcess(host, port)))
        }

        /* else (not opened), download and run selenium server on defined port */
        console.log('SELENIUM_RUNNER_PORT is currently not opened => start new process with port ' + port);
        download(url, outfile, function (er) {
            if (er) return cb(er);
            runSelenium(host, port, cb)
        })
    });
}

/**
 * Run Selenium server on random port
 * @param host
 * @param cb
 */
function runOnRandomPort(host, cb) {
    /* find random free port */
    freeport(function (er, port) {
        if (er) throw er;

        runSelenium(host, port, cb);
    })
}

/**
 * Create fake process as real running process
 * @param host
 * @param port
 * @constructor
 */
function FakeProcess(host, port) {
    EventEmitter.call(this);
    this.host = host;
    this.port = port
}

util.inherits(FakeProcess, EventEmitter);
FakeProcess.prototype.kill = function () {
    this.emit('exit');
};

module.exports = function (cb) {
    var host = (process.env.SELENIUM_RUNNER_HOST ? process.env.SELENIUM_RUNNER_HOST : '127.0.0.1');
    var port = (process.env.SELENIUM_RUNNER_PORT ? process.env.SELENIUM_RUNNER_PORT : 0);

    /* if SELENIUM_RUNNER_PORT is defined */
    if (port > 0) {
        /* if SELENIUM_RUNNER_PORT is currently opened => create a FakeProcess connects to host:port */
        console.log('SELENIUM_RUNNER_PORT is defined as ' + port + ' => start new process defined port');
        runOnDefinedPort(host, port, cb);
    } else {
        /* else (not defined), download and run selenium server on random free port */
        console.log('SELENIUM_RUNNER_PORT is not defined => start new process with random free port');
        download(url, outfile, function (er) {
            if (er) return cb(er);
            runOnRandomPort(host, cb)
        })
    }
};
