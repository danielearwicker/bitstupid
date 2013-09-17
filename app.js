var util = require('./util');

var fs = util.promisify(require('fs'));

var express = require('express');

var AWS = require('aws-sdk');
var gm = require('gm');
var Q = require('q');

var log = require('./log');
var config = require('./config');
var views = require('./views');
var images = require('./images');

AWS.config.update(config.aws);
log(AWS.config.credentials);

var s3 = util.promisify(log.wrap('AWS.S3.', new AWS.S3({ apiVersion: '2006-03-01' })));

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
    return util.promiseRange(0, 2, function(image) {
        var key = 'creating-' + username + '-'+ image;
        return s3.headObject({
            Bucket: 'bitstupid-images',
            Key: key
        }).thenResolve(key);
    }).then(function(images) {
        res.send(views.create({ images: images }));
    });
}));

app.get('/images/:imgkey', logErrors(function(req, res) {
    return s3.getObject({
        Bucket: 'bitstupid-images',
        Key: req.params.imgkey
    }).then(function(data) {
        res.set('Content-Type', data.ContentType);
        res.send(data.Body);
    });
}));

app.post('/images', logErrors(function(req, res) {

    log('Handling /images');

    var forEachImage = function(func) {
        return util.promiseRange(0, 2, function(i) {
            return func(req.files['image' + i], i);
        });
    };

    return forEachImage(function(file, index) {

        log('forEachImage - get contentType ' + index);

        var contentType = file.headers['content-type'];
        if (!contentType || !contentType.match(/^image\//)) {
            log('File upload is wrong type - ignoring');
            return false;
        } else {
            log('readFile ' + index);

            return fs.readFile(file.path).then(function(image) {

                log('checking length ' + index);

                if (image.length == 0) {
                    log('File upload is zero length - ignoring');
                    return false;
                } else {
                    log('resizing ' + index);

                    return images.resize(image, 96, 96).then(function(resizedImage) {

                        log('storing ' + index);

                        return s3.putObject({
                            Bucket: 'bitstupid-images',
                            Body: resizedImage,
                            ContentType: file.type,
                            Key: 'creating-' + username + '-' + index
                        });
                    });
                }
            });
        }
    }).then(function() {
        log('Okay - redirecting');
        res.redirect('create');
    }).fin(function() {
        return forEachImage(function(file) {
            log('Deleting temporary file: ' + file.path);
            return fs.unlink(file.path);
        });
    }).catch(function(x) {
        log('Caught', x);
    });
}));


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

