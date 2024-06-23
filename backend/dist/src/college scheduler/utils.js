"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBy = exports.extend_id_to_24_char = exports.insert_many_hlpr = void 0;
const db_1 = require("../utils/db");
function insert_many_hlpr(table_name_and_fields, left_value, right_values, connection) {
    return __awaiter(this, void 0, void 0, function* () {
        let sql_professor_ban_time_query = "INSERT INTO " + table_name_and_fields + " VALUES ";
        for (let right_value of right_values)
            sql_professor_ban_time_query += "(" + connection.escape(left_value) + "," + connection.escape(right_value) + "),";
        if (right_values.length > 0)
            yield (0, db_1.async_get_query)(sql_professor_ban_time_query.slice(0, -1), connection);
    });
}
exports.insert_many_hlpr = insert_many_hlpr;
const extend_id_to_24_char = (id) => 'a'.repeat(24 - String(id).length) + id;
exports.extend_id_to_24_char = extend_id_to_24_char;
function groupBy(list, keyGetter) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        }
        else {
            collection.push(item);
        }
    });
    return map;
}
exports.groupBy = groupBy;
