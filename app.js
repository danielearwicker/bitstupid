var express = require('express');
var fs = require('fs');
var AWS = require('aws-sdk');
var gm = require('gm');
var Q = require('q');

var log = require('./log');
var config = require('./config');
var views = require('./views');

AWS.config.update(config.aws);
log(AWS.config.credentials);

var s3 = log.wrap('AWS.S3.', new AWS.S3({ apiVersion: '2006-03-01' }));

var q = {
    headObject: Q.nbind(s3.headObject, s3),
    getObject: Q.nbind(s3.getObject, s3),
    putObject: Q.nbind(s3.putObject, s3),
    readFile: Q.nbind(fs.readFile, fs)
};

var app = express();
app.use(express.bodyParser());
app.use("/static", express.static('static'));

var username = 'danielearwicker';

app.get('/', function(req, res) {
    res.send(views.home({ age: 41 }));
});

var logErrors = function(handler) {
    return function(req, res) {
        return handler(req, res).catch(function(err) {
            res.send(500, JSON.stringify(err));
        });
    };
};

app.get('/create', logErrors(function(req, res) {
    return Q.all([0, 1].map(function(image) {
        var key = 'creating-' + username + '-'+ image;
        return q.headObject({
            Bucket: 'bitstupid-images',
            Key: key
        }).then(function() {
            return key;
        });
    })).then(function(images) {
        res.send(views.create({ images: images }));
    });
}));

app.get('/images/:imgkey', logErrors(function(req, res) {
    return q.getObject({
        Bucket: 'bitstupid-images',
        Key: req.params.imgkey
    }).then(function(data) {
        res.set('Content-Type', data.ContentType);
        res.send(data.Body);
    });
}));

app.post('/images', function(req, res) {
    return Q.all([0, 1].map(function(imageNumber) {

        var file = req.files['image' + imageNumber];

        return q.readFile(file.path).then(function(image) {

            if (file.type && file.type.match(/^image\//) && (image.length != 0)) {

                var d = Q.defer();
                gm(image).resize(96, 96).toBuffer(d.makeNodeResolver());

                return d.promise.then(function(resizedImage) {
                    return q.putObject({
                        Bucket: 'bitstupid-images',
                        Body: resizedImage,
                        ContentType: file.type,
                        Key: 'creating-' + username + '-' + imageNumber
                    });
                });

            } else {
                log('File upload is wrong type');
                return false;
            }
        });

    })).then(function() {

        res.redirect('create');

    }).fin(function() {
        return Q.all([0, 1].map(function(imageNumber) {
            var path = req.files['image' + imageNumber].path;
            log('Deleting temporary file: ' + path);
            return q.unlink(path);
        }));
    });
});


app.get('/:username/:id/state', function(req, res) {

    var key = req.params.username + ':' + req.params.id;

    log(req);
});

/*
app.post('/:username/:id/state', function(req, res) {
    redis.lpush(
        req.params.username + ':' + req.params.id,
        new Date().toISOString(),
        function(err, count) {
            if (err) {
                res.send(500, err.message);
            } else {
                res.send({
                    state: !!(count % 2)
                });
            }
        }
    );
});
*/

app.listen(3000);

