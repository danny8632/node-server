const mysql = require('mysql');

const connectionData = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_DATABASE
}


var connection = mysql.createConnection(connectionData);

function queryDatabase(queryStr, cb) {

    //connection.connect();

    connection.query(queryStr, (error, results, fields) => {
        if (error) throw error;

        cb(results, fields);
    });
        
    
    //connection.end();
}

module.exports.queryDatabase = queryDatabase;
