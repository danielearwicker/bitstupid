var log = console.log;
// var log = function() {};

exports = module.exports = log;

// Object.keys doesn't get inherited keys
var getAllKeys = function(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
    }
    return keys;
};

exports.wrap = function(prefix, real) {
    var wrapped = {};
    getAllKeys(real).forEach(function(key) {
        wrapped[key] = function() {
            log(prefix + key, arguments);
            real[key].apply(real, arguments);
        };
    });
    return wrapped;
};





