var mysql = require('mysql');
var Q = require("q");

var log = require('./log');
var config = require('./config');

var enablePooling = false;

var pool = enablePooling ? mysql.createPool(config.mysql) : {
    getConnection: function(done) {
        var c = mysql.createConnection(config.mysql);
        c.release = c.end;
        done(null, c);
    }
};

exports.connect = Q.nbind(pool.getConnection, pool);

exports.query = function(sql, params) {
    return exports.connect().then(function(con) {
        var d = Q.defer();
        con.query(sql, params, function(err, result) {
            if (err) {
                d.reject(err);
            } else {
                d.resolve(result);
            }
        });
        return d.promise;
    });
};

exports.create = function(table, params, done) {
    var sql = 'INSERT INTO ' + mysql.escapeId(table) + ' SET ?';
    return exports.query(sql, params).then(function(result) {
        return result.insertId;
    });
};

exports.get = function(table, id, done) {
    var sql = 'SELECT * FROM ' + mysql.escapeId(table) + ' WHERE id = ?';
    return exports.query(sql, [id]);
};

/*
exports.create('bits', {
    creator: 1,
    created: new Date(),
    name: 'Bob'
}).then(function(bitId) {
    return exports.get('bits', bitId);
}).then(function(bitObj) {
    log(bitObj);
}).catch(function(err) {
    console.log('Caught:', err);
});
*/