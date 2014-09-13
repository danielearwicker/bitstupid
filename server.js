var funkify = require('funkify');
var ay = require('ay');

var request = funkify(require('request'));

var config = require('../bitstupid-config.json');
var data = require('./data');

var koa = require('koa');

var app = koa();
app.use(require('koa-static')(__dirname + '/static'));
app.use(require('koa-body-parser')());
app.use(require('koa-router')(app));

app.get('/bits/:of', function* () {
    var bit = yield data.readBit(
        this.params.of.toLowerCase(), 
        this.query.skip, 
        this.query.take);

    yield ay(bit.changes).forEach(function* (change) {
        change.info = yield data.getInfo(change.by);
    });

    this.body = bit;
});

app.get('/activity/:by', function* () {
    var user = yield data.readActivity(
        this.params.by.toLowerCase(), 
        this.query.skip, 
        this.query.take);

    yield ay(user.activity).forEach(function* (update) {
        update.info = yield data.getInfo(update.of);
    });

    this.body = user;
});

app.post('/bits/:of', function* () {
    this.body = yield data.toggleBit(this.params.of.toLowerCase(), 
                yield data.getNameFromSecret(this.request.body.secret));
});

app.get('/users/:name', function* () {
    this.body = yield data.getInfo(this.params.name.toLowerCase());
});

app.get('/stats', function* () {
    
    var users = yield data.topUsers(10),
        bits = yield data.topBits(10),
        log = yield data.log(20);

    this.body = { 
        users: yield ay(users).map(function* (name) {
            return yield data.getInfo(name);            
        }),
        bits: yield ay(bits).map(function* (name) {
            return yield data.getInfo(name);
        }),
        log: yield ay(log).map(function* (event) {
            return {
                at: event.at,
                by: yield data.getInfo(event.by),
                of: yield data.getInfo(event.of),
            }
        })
    };
});

app.get(/^\/secrets\/(.+)$/, function* () {
    var user = yield data.getNameFromSecret(this.params[0]);
    this.body = {
        name: user, 
        info: yield data.getInfo(user) 
    };
});

var providerPrefixes = {
    'Twitter': 'tw',
    'Facebook': 'fb',
    'Google+': 'gp',
    'Yahoo!': 'yh'
};

app.post('/janrain', function* () {
    var token = this.request.body.token;
    if (token.length !== 40) {
        throw new Error('Token should be 40 characters');
    }
    
    var info = JSON.parse((yield request.post({
        uri: 'https://rpxnow.com/api/v2/auth_info',
        form: {
            token: token,
            apiKey: config.janrain.apiKey,
            format: 'json',
            extended: false
        }
    }))[1]).profile;
    
    var prefix = providerPrefixes[info.providerName];
    if (!prefix) {
        throw new Error('Unexpected providerName: ' + info.providerName + " in " + JSON.stringify(info, null, 4));
    }

    if (!info.preferredUsername) {
        throw new Error('Unexpected missing preferredUsername: ' + JSON.stringify(info, null, 4));
    }

    var user = prefix + ':' + info.preferredUsername.toLowerCase();
    
    yield data.setInfo(user, info);
    
    this.body = {
        secret: yield data.getSecret(user),
        name: user,
        info: info
    };
});

app.listen(3000);

