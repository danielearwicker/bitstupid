var express = require('express')
var app = express();

var fs = require('fs');

var dataDir = 'data';

var dateStampNow = function() {
    return new Date().toISOString() + '\n';
};

var dateStampSize = dateStampNow().length;

if (!fs.existsSync(dataDir)) {
    fs.mkdir(dataDir); 
}

app.use("/", express.static('web'));

app.get('/version', function(req, res) {
    res.send('1');
});

var getFileFromParams = function(req) {
    return dataDir + '/' + req.params.username + '/' + req.params.id;
};

app.get('/togglz/:username/:id', function(req, res) {
    
    fs.open(getFileFromParams(req), 'r', function(err, fd) {
        if (err) {
            res.send(500, err.message);
        } else {
            fs.fstat(fd, function(err, stats) {
                if (err) {
                    res.send(500, err.message);
                } else {
                    var count = Math.floor(stats.size / dateStampSize);
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

                        var byteStart = (count - (skip + take)) * dateStampSize﻿;
                        var byteCount = take * dateStampSize;

                        fs.read(fd, new Buffer(byteCount), 0, byteCount, byteStart﻿, function(err, bytesRead, buf) {
                            if (err) {
                                res.send(500, err.message);
                            } else {
                                var changes = buf.toString().split('\n');
                                changes.pop();
                                changes.reverse();

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
        }
    });
});

app.post('/togglz/:username/:id', function(req, res) {
    var filename = getFileFromParams(req);
    
    if (req.query.set) {
    
        fs.open(getFileFromParams(req), 'r', function(err, fd) {
            if (err) {
                res.send(500, err.message);
            } else {
                fs.fstat(fd, function(err, stats) {
                    if (err) {
                        res.send(500, err.message);
                    } else {
                        var count = Math.floor(stats.size / dateStampSize);
                        var state = !!(count % 2);

                        if ((req.query.set == 'true') != state) {
                            fs.appendFileSync(filename, dateStampNow());
                            res.send({ state: !state });
                        } else {
                            res.send({ state: state, ignored: true });
                        }
                    }
                });
            }
        });
    } else {
        fs.appendFileSync(filename, dateStampNow());
        res.send({ toggled: true });
    }
});

app.listen(3000);

