var jade = require('jade');
var path = require('path');
var fs = require('fs');

var views = {};

var jadeOptions = {
    pretty: true
};

fs.readdirSync(__dirname).forEach(function(name) {
    if (name != 'index.js') {
        views[name.split('.')[0]] = jade.compile(
            fs.readFileSync(path.join(__dirname, name), 'utf8'),
            jadeOptions
        );
    }
});

module.exports = views;