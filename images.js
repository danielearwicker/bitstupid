var gm = require('gm');
var Q = require('q');

exports.resize = function(imageBuffer, width, height) {
    var d = Q.defer();
    gm(imageBuffer).resize(width, height).toBuffer(d.makeNodeResolver());
    return d.promise;
};

