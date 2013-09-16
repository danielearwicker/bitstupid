var handlebars = require("handlebars");
var path = require('path');
var fs = require('fs');

var views = {};

fs.readdirSync(__dirname).forEach(function(name) {
    if (name != 'index.js') {
        views[name.split('.')[0]] = handlebars.compile(
            fs.readFileSync(path.join(__dirname, name), 'utf8')
        );
    }
});

module.exports = views;