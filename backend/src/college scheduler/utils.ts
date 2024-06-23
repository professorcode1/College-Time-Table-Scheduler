import { Connection } from "mysql";
import { async_get_query } from "../utils/db";

async function insert_many_hlpr(
    table_name_and_fields:string, 
    left_value:string, 
    right_values:number[],
    connection:Connection
) {
    let sql_professor_ban_time_query = "INSERT INTO " + table_name_and_fields + " VALUES "
    for (let right_value of right_values)
        sql_professor_ban_time_query += "(" + connection.escape(left_value) + "," + connection.escape(right_value) + "),";
    if (right_values.length > 0)
        await async_get_query(sql_professor_ban_time_query.slice(0, -1), connection);
}

const extend_id_to_24_char = (id:string|number) => 'a'.repeat(24 - String(id).length) + id;
function groupBy(list:{[key:string]:string|number|boolean}[], keyGetter:(a:any)=>string) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}

export {insert_many_hlpr, extend_id_to_24_char, groupBy}