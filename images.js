var gm = require('gm');
var Q = require('q');

exports.resize = function(imageBuffer, width, height) {
    var d = Q.defer();

    console.log('start resizing');

    gm(imageBuffer).resize(width, height).toBuffer(function(err, res) {
        console.log('finished resizing');

        d.makeNodeResolver(err, res);
    });

    return d.promise;
};

