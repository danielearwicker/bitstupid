var mysql = require('mysql');
var config = require('./config');

var connection = mysql.createConnection(config.mysql);

connection.query('SELECT * from users', function(err, users) {
    if (err) {
        console.log(err);
        connection.end();
    } else {
        console.log(users);
        connection.end();
    }
});
