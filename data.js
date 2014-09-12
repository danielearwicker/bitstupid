var funkify = require('funkify');

var redis = funkify(require('redis').createClient());
var crypto = funkify(require('crypto'));

var co = require('co');

var upgrade = function* () {
    if (yield redis.exists('topBits')) {
        console.log('No need to upgrade');
        return;
    }
    
    console.log('Upgrading...');
    var count = yield redis.llen('log');
    var changes = yield redis.lrange('log', 0, count);
    
    for (var c = 0; c < changes.length; c++) {
        var change = JSON.parse(changes[c]);
        yield redis.zincrby('topBits', 1, change.of);
        yield redis.zincrby('topUsers', 1, change.by);
    }
};

co(upgrade)(function(err, res) {
    console.log('Upgrade finished', err, res);
});

exports.topUsers = function *(count) {
    return yield redis.zrevrange('topUsers', 0, count); 
};

exports.topBits = function *(count) {
    return yield redis.zrevrange('topBits', 0, count); 
};

exports.toggleBit = function* (of, by) {

    var at = new Date();

    var count = yield redis.lpush('bit:' + of, JSON.stringify({ at: at, by: by }));
    yield redis.lpush('activity:' + by, JSON.stringify({ at: at, of: of }));
    yield redis.lpush('log', JSON.stringify({ at: at, by: by, of: of }));
    yield redis.zincrby('topBits', 1, of);
    yield redis.zincrby('topUsers', 1, by);

    return {
        count: count,
        state: !!(count % 2)
    };
};

exports.readBit = function* (of, skip, take) {

    skip = parseInt(skip, 10) || 0;
    take = parseInt(take, 10) || 1;

    var count = yield redis.llen('bit:' + of);
    var changes = yield redis.lrange('bit:' + of, skip, skip + take - 1);

    return {
        count: count, 
        changes: changes.map(JSON.parse), 
        state: !!(count % 2) 
    };
};

exports.readActivity = function* (by, skip, take) {

    skip = parseInt(skip, 10) || 0;
    take = parseInt(take, 10) || 1;

    var count = yield redis.llen('activity:' + by);
    var changes = yield redis.lrange('activity:' + by, skip, skip + take - 1);

    return { 
        count: count, 
        activity: changes.map(JSON.parse)
    };
};

exports.getSecret = function* (of) {
 
    var secret = yield redis.hget('user:' + of, 'secret');
    if (secret === null) {
        var secret = (yield crypto.randomBytes(128)).toString('base64');
        if ((yield redis.hsetnx('user:' + of, 'secret', secret)) === 0) {
            secret = yield redis.hget('user:' + of, 'secret');
        } else {
            yield redis.set('secret:' + secret, of);
        }
    }

    if (secret === null) {
        throw new Error('Unexpected: could not get secret of ' + of);
    }
    
    return secret;
};

exports.getNameFromSecret = function* (secret) {
    var name = yield redis.get('secret:' + secret);
    if (!name) {
        throw new Error('Unrecognised secret: ' + secret);
    }
    return name;
};

exports.getInfo = function* (of) {
    var info = JSON.parse(yield redis.hget('user:' + of, 'info'));
    if (!info) {
        throw new Error('Unrecognised user: ' + of);
    }
    return info;
};

exports.setInfo = function* (of, info) {
    yield redis.hset('user:' + of, 'info', JSON.stringify(info));
};
