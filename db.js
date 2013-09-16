var mysql = require('mysql');
var Q = require("q");

var log = require('./log');
var config = require('./config');

var enablePooling = true;

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

var sqlTemplatePattern = /(\[\])/g;

exports.sql = function(sql, ids) {
    return sql.split(sqlTemplatePattern).map(function(p, i) {
        return i%2 ? mysql.escapeId(ids[Math.floor(i/2)]) : p;
    }).join('');
};

exports.create = function(table, params) {
    return exports.query(
        exports.sql('INSERT INTO [] SET ?', [table]),
        params).then(function(result) {
            return result.insertId;
        }
    );
};

exports.get = function(table, id) {
    return exports.query(exports.sql('SELECT * FROM [] WHERE id = ?', [table]), [id]);
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