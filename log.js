var util = require('./util');

var log = console.log;
// var log = function() {};

exports = module.exports = log;

exports.wrap = function(prefix, real) {
    return util.wrap(real, function(func, name) {
        return function() {
            log(prefix + name, arguments);
            func.apply(real, arguments);
        };
    });
};





