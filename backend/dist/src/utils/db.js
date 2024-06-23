"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.async_get_query = exports.async_push_query = void 0;
const util = require('util');
function async_push_query(sql_query, info, connection) {
    return util.promisify(connection.query).call(connection, sql_query, info);
}
exports.async_push_query = async_push_query;
function async_get_query(sql_query, connection) {
    return util.promisify(connection.query).call(connection, sql_query);
}
exports.async_get_query = async_get_query;
