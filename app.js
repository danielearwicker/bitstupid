var express = require('express');
var fs = require('fs');
var path = require('path');
var AWS = require('aws-sdk');
var views = require('./views');
var gm = require('gm');

var log = console.log;
// var log = function() {}

// Load AWS configuration
AWS.config.loadFromPath(path.join(__dirname, '../../aws-config.json'));
log(AWS.config.credentials);

// Object.keys doesn't get inherited keys
var getAllKeys = function(obj) {
    var keys = [];
    for (var key in obj) {
        keys.push(key);
    }
    return keys;
};

// Wrap S3 API in verbose logging
var actualS3 = new AWS.S3({ apiVersion: '2006-03-01' });
var s3 = {};
getAllKeys(actualS3).forEach(function(key) {
    s3[key] = function() {
        log('Calling Amazon S3: ' + key);
        log(arguments);
        actualS3[key].apply(actualS3, arguments);
    };
});

var app = express();

// app.use("/static", express.static('static'));

app.use(express.bodyParser());

// Utility that standardising error handling
var ifGood = function(res, handler) {
    return function(err, data) {
        if (err) {
            log(err.message);
            res.send(500, err.message);
        } else {
            handler(data);
        }
    };
};

var username = 'danielearwicker';

app.get('/', function(req, res) {
    res.send(views.home({ age: 41 }));
});

app.get('/create', function(req, res) {
    var images = {};
    [0, 1].forEach(function(image) {
        var key = 'creating-' + username + '-' + image;
        s3.headObject({
            Bucket: 'bitstupid-images',
            Key: key
        }, function(err) {
            images[image] = err ? null : key;
            if (Object.keys(images).length == 2) {
                res.send(views.create({ images: images }));
            }
        });
    });
});

app.get('/images/:imgkey', function(req, res) {
    s3.getObject({
        Bucket: 'bitstupid-images',
        Key: req.params.imgkey
    },
    ifGood(res, function(data) {
        res.set('Content-Type', data.ContentType);
        res.send(data.Body);
    }));
});

app.post('/images', function(req, res) {
    var finishedCount = 0;

    var finished = function() {
        finishedCount++;
        if (finishedCount == 2) {
            log('Both stores completed successfully');
            res.redirect('create');
        }
    };

    var localIfGood = function(handler) {
        return function(err, data) {
            if (err) {
                log(err.message);
                finished();
            } else {
                handler(data);
            }
        };
    };

    [0, 1].forEach(function(image) {
        fs.readFile(req.files['image' + image].path, localIfGood(function(body) {

            var contentType = req.files['image' + image].type;
            if (contentType &&
                contentType.match(/^image\//) &&
                (body.length != 0)) {

                gm(body).resize(96, 96).toBuffer(localIfGood(function(resizedBody) {
                    s3.putObject({
                            Bucket: 'bitstupid-images',
                            Body: resizedBody,
                            ContentType: contentType,
                            Key: 'creating-' + username + '-' + image
                        },
                        localIfGood(finished)
                    );
                }));

            } else {
                finished();
            }

        }));
    });
});


app.get('/:username/:id/state', function(req, res) {

    var key = req.params.username + ':' + req.params.id;

    log(req);

/*    redis.llen(key, function(err, count) {
        if (err) {
            res.send(500, err.message);
        } else {
            var skip = Math.min(req.query.skip || 0, count);
            var take = Math.min(count - skip, req.query.take || 1);
            if (take == 0) {
                res.send({
                    count: count,
                    offset: skip,
                    changes: [],
                    state: !!(count % 2)
                });
            } else {
                redis.lrange(key, skip, skip + take - 1, function(err, changes) {
                    if (err) {
                        res.send(500, err.message);
                    } else {
                        res.send({
                            count: count,
                            offset: skip,
                            changes: changes,
                            state: !!(count % 2)
                        });
                    }
                });
            }
        }
    });
    */
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

app.listen(80);

