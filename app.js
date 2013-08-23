var express = require('express');
var views = require('./views');

var app = express();

app.use("/img", express.static('img'));

app.get('/', function(req, res) {
    res.send(views.home({ age: 41 }));
});

app.get('/togglz/create', function(req, res) {
    res.send(views.home({ age: 41 }));
});

/*
app.get('/:username/:id/state', function(req, res) {

    var key = req.query.username + ':' + req.query.id;

    redis.llen(key, function(err, count) {
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
});

app.post('/:username/:id/state', function(req, res) {
    redis.lpush(
        req.query.username + ':' + req.query.id,
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

