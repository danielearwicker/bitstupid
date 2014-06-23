var funkify = require('funkify');

var request = funkify(require('request'));

var config = require('../bitstupid-config.json');
var data = require('./data');

var koa = require('koa');

var app = koa();
app.use(require('koa-static')(__dirname + '/static'));
app.use(require('koa-body-parser')());
app.use(require('koa-router')(app));

app.get('/bits/:of', function* () {
    this.body = yield data.readBit(this.params.of.toLowerCase(), this.query.skip, this.query.take);
    for (var n = 0; n < this.body.changes.length; n++) {
        this.body.changes[n].info = yield data.getInfo(this.body.changes[n].by);
    }
});

app.get('/activity/:by', function* () {
    this.body = yield data.readActivity(this.params.by.toLowerCase(), this.query.skip, this.query.take);
    for (var n = 0; n < this.body.activity.length; n++) {
        this.body.activity[n].info = yield data.getInfo(this.body.activity[n].of);
    }
});


app.post('/bits/:of', function* () {
    this.body = yield data.toggleBit(this.params.of.toLowerCase(), 
                    yield data.getNameFromSecret(this.request.body.secret));
});

app.get('/users/:name', function* () {
    this.body = yield data.getInfo(this.params.name.toLowerCase());
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

