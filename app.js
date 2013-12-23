var util = require('./util');

var fs = util.promisify(require('fs'));
var https = util.promisify(require('https'));

var express = require('express');

var AWS = require('aws-sdk');
var gm = require('gm');

var log = require('./log');
var config = require('./config');
var views = require('./views');
var images = require('./images');
var call = require('./call');

AWS.config.update(config.aws);

var s3 = util.promisify(log.wrap('AWS.S3.', new AWS.S3({ apiVersion: '2006-03-01' })));

var app = express();
app.use(express.bodyParser());
app.use("/static", express.static('static'));
util.expressPromises(app);

var username = 'danielearwicker';

app.getQ('/', function() {
    return views.home({ user: 'not-implemented' });
});

app.getQ('/create', function() {
    return util.promiseRange(0, 2, function(image) {
        var key = 'creating-' + username + '-'+ image;
        return s3.headObject({
            Bucket: 'bitstupid-images',
            Key: key
        }).thenResolve(key);
    }).then(function(images) {
        return views.create({ images: images });
    });
});

app.getQ('/images/:imgkey', function(req) {
    return s3.getObject({
        Bucket: 'bitstupid-images',
        Key: req.params.imgkey
    }).then(function(data) {
        return {
            contentType: data.ContentType,
            body: data.body
        };
    });
});

app.postQ('/images', function(req) {

    var forEachImage = function(func) {
        return util.promiseRange(0, 2, function(i) {
            return func(req.files['image' + i], i);
        });
    };

    return forEachImage(function(file, index) {
        var contentType = file.headers['content-type'];
        if (!contentType || !contentType.match(/^image\//)) {
            log('File upload is wrong type - ignoring');
            return false;
        } else {
            return fs.readFile(file.path).then(function(image) {
                if (image.length == 0) {
                    log('File upload is zero length - ignoring');
                    return false;
                } else {
                    return images.resize(image, 96, 96).then(function(resizedImage) {
                        return s3.putObject({
                            Bucket: 'bitstupid-images',
                            Body: resizedImage,
                            ContentType: contentType,
                            Key: 'creating-' + username + '-' + index
                        });
                    });
                }
            });
        }
    }).then(function() {
        return { redirect: 'create' }
    }).fin(function() {
        return forEachImage(function(file) {
            return fs.unlink(file.path);
        });
    });
});

app.getQ('/login', function() {
    return views.login({ baseUrl: config.bitstupid.baseUrl });
});

app.postQ('/token', function(req) {
    var token = req.body.token;
    if (token.length !== 40) {
        throw new Error('Token should be 40 characters');
    } else {
        return call.post({
            host: 'rpxnow.com',
            port: 443,
            path: '/api/v2/auth_info',
            data: {
                token: token,
                apiKey: config.janrain.apiKey,
                format: 'json',
                extended: false
            }
        }).then(function(janrainResult) {
            return views.home({
                user: JSON.stringify(janrainResult)
            });
        });
    }
});

app.getQ('/:username/:id/state', function(req) {

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

