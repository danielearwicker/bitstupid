var Q = require('q');

// Object.keys doesn't get inherited keys
exports.getAllKeys = function(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
    }
    return keys;
};

exports.wrap = function(inner, wrap) {
    var wrapped = {};
    exports.getAllKeys(inner).forEach(function(key) {
        wrapped[key] = wrap(inner[key], key);
    });
    wrapped.$inner = inner;
    return wrapped;
};

exports.promisify = function(inner) {
    return exports.wrap(inner, function(func) {
        return Q.nbind(func, inner);
    });
};

exports.promiseRange = function(start, count, each) {
    var results = [];
    for (var n = start; n < count; n++) {
        results.push(each(n));
    }
    return Q.all(results);
};

exports.expressPromises = function(app) {
    ['get', 'post'].forEach(function (methodName) {
        var original = app[methodName];
        app[methodName + 'Q'] = function(path, handler) {
            original.call(app, path, function(req, res) {
                return Q.fcall(handler, req).then(
                    function(result) {
                        if (result && result.contentType && result.body) {
                            res.set('Content-Type', result.contentType);
                            res.send(result.body);
                        } else if (result && result.redirect) {
                            res.redirect(result.redirect);
                        } else {
                            res.send(result);
                        }
                    },
                    function(err) {
                        res.send(500, JSON.stringify(err));
                    }
                );
            });
        };
    });
};

