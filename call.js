var querystring = require('querystring');
var https = require('https');
var Q = require('q');

exports.post = function(config) {
    var content = querystring.stringify(config.data);

    var result = Q.defer();

    var req = https.request({
        host: config.host,
        port: config.port,
        path: config.path,
        method: 'POST',
        headers: {
            'Content-Length': content.length,
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }, function(res) {
        var data = '';
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function() {
            result.resolve(data);
        });
        res.on('error', function(e) {
            result.reject(e);
        });
    });

    req.on('error', function(err) {
        result.reject(err);
    });

    req.write(content);
    req.end();

    return result.promise;
}
