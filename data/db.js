const mysql = require('mysql2/promise');

module.exports = function(){

    return mysql.createPool({
        host:'localhost',
        user:'root',
        password:'P@ssw0rd',
        database:'dndb',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });

}
