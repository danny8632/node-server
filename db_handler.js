const mysql = require('mysql');
const crypto = require('crypto');

const connectionData = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE,
    multipleStatements: true
}


var connection = mysql.createConnection(connectionData);

function queryDatabase(queryStr, cb) {

    connection.query(queryStr, (error, results, fields) => {
        cb(error, results, fields);
    });
}

function authenticate(username, password, cb) {

    let sql = mysql.format("SELECT id FROM Users AS users WHERE username = ? AND password = ? LIMIT 1;", [username, password]);

    queryDatabase(sql, (error, results, fields) => {

        if (error) return cb({ success: false, error: error.sqlMessage }, "");

        if (results.length == 0 || typeof results[0].id === "undefined") return cb({ success: false, "error": "wrong login" }, "");

        let userId = results[0].id;

        let hash = crypto.createHash('md5').update(`${username}${userId}${new Date().getTime()}`).digest("hex");

        sql = mysql.format(
            "DELETE FROM DinMarkedsplads.UserToken WHERE userId=?;INSERT INTO UserToken (userId, token) VALUES(?, ?);",
            [userId, userId, hash]
        );

        queryDatabase(sql, (error, results, fields) => {

            if (error) return cb({ success: false, "error": error.sqlMessage }, "");

            return cb("", { success: true, token: hash })
        });
    });
}


function validateToken(authToken, cb) {

    let sql = mysql.format("SELECT id, userId, expires FROM UserToken WHERE token = ?;", [authToken]);

    queryDatabase(sql, (error, results, fields) => {

        if (error || results.length <= 0 || typeof results[0].expires === "undefined") return cb(false, 0);

        let expire = new Date(results[0].expires).getTime();

        //  Expired..
        if (expire <= new Date().getTime()) {
            sql = mysql.format("DELETE FROM UserToken WHERE token = ? LIMIT 1;", [authToken]);
            queryDatabase(sql, (error, results, fields) => {
                return cb(false, results[0].userId);
            });
        }
        else {
            cb(true, results[0].userId);
        }
    })
}


module.exports.queryDatabase = queryDatabase;
module.exports.authenticate = authenticate;
module.exports.validateToken = validateToken;
