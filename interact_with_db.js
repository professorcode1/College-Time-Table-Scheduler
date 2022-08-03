var mysql = require('mysql');
const util = require('util');
require('dotenv').config();


var options = {
    host: 'sql6.freemysqlhosting.net',
    port: 3306,
    user: 'sql6501006',
    password: 'e2aMmPgLUT',
    database: 'sql6501006'
};

var connection = mysql.createConnection(options);

connection.connect();

function async_get_query(sql_query) {
    return util.promisify(connection.query).call(connection, sql_query);
}
function async_push_query(sql_query, info) {
    return util.promisify(connection.query).call(connection, sql_query, info);
}
