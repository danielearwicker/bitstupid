var mysql = require('mysql');

var log = require('./log');
var config = require('./config');

log('msql config', config.mysql);

var connection = log.wrap('mysql', mysql.createConnection(config.mysql));

connection.query('SELECT * from users', function(err, users) {
    if (err) {
        log(err);
        connection.end();
    } else {
        log(users);
        connection.end();
    }
});
