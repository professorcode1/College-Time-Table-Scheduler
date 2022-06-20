var mysql = require('mysql');
var fs = require('fs');
var path = require("path");
require('dotenv').config();
const util = require('util');

var options = {
    host: process.env.MYSQL_HOST,
    port: process.env.MYSQL_PORT,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQLPASS,
    database: process.env.DATABASE_NAME
};
var connection = mysql.createConnection(options);

connection.connect();

function async_get_query(sql_query) {
    return util.promisify(connection.query).call(connection, sql_query);
}
function async_push_query(sql_query, info) {
    return util.promisify(connection.query).call(connection, sql_query, info);
}
async function insert_many_hlpr(table_name_and_fields, left_value, right_values) {
    let sql_professor_ban_time_query = "INSERT INTO " + table_name_and_fields + " VALUES "
    for (let right_value of right_values)
        sql_professor_ban_time_query += "(" + left_value + "," + right_value + "),";
    if (right_values.length > 0)
        await async_get_query(sql_professor_ban_time_query.slice(0, -1));
}
async function main(university_id, json_file){
    const database_json_Obj = JSON.parse(await fs.promises.readFile(path.join(__dirname, json_file), 'utf-8'));
    // console.log(database_json_Obj);
    await async_get_query(`UPDATE university SET periods_per_day = ${database_json_Obj.periodsPerDay}, days_per_week = ${database_json_Obj.numberOfDays} WHERE university_id = ${university_id}`);
    const groupMap = new Map();
    const roomMap = new Map();
    const professorMap = new Map();
    const courseMap = new Map();
    for(let room of database_json_Obj.rooms){
        room.sql_id = (await async_get_query(`INSERT INTO room(university_id, name, capacity) VALUES (${university_id}, "${room.roomName}", ${room.roomCapacity})` )).insertId;
        await insert_many_hlpr("room_ban_times", room.sql_id, room.unAvialability);
        roomMap.set(room._id, room);
    }
    for(let professor of database_json_Obj.professors){
        professor.sql_id = (await async_get_query(`INSERT INTO professor(university_id,name) VALUES (${university_id}, "${professor.profName}")`)).insertId;
        await insert_many_hlpr("professor_ban_times", professor.sql_id, professor.unAvialability);
        professorMap.set(professor._id, professor);
    }
    for(let group of database_json_Obj.groups){
        group.sql_id = (await async_get_query(`INSERT INTO \`group\`(university_id, name, number_of_students) VALUES (${university_id},"${group.groupName}", ${group.groupQuantity})`)).insertId;
        await insert_many_hlpr("group_ban_times", group.sql_id, group.unAvialability);
        groupMap.set(group._id, group);
    }
    for(let course of database_json_Obj.courses){
        course.sql_id = (await async_get_query(`INSERT INTO course(university_id, name) VALUES (${university_id},"${course.courseName}")`)).insertId;
        for(let profId of course.taughtBy){
            await async_get_query(`INSERT INTO course_professor VALUES (${course.sql_id}, ${professorMap.get(profId).sql_id})`);
        }
        for(let groupId of course.taughtTo){
            await async_get_query(`INSERT INTO course_group VALUES (${course.sql_id}, ${groupMap.get(groupId).sql_id})`);
        }
        courseMap.set(course._id, course);
    }
    for(let period of database_json_Obj.periods){
        let sql_string_l = "", sql_string_r = "";
        if(period.periodTime != -1){
            sql_string_l = "INSERT INTO \`period\`(name, course_id, professor_id, room_id, length, frequency) VALUES "
            sql_string_r = `("${period.periodName}", ${courseMap.get(period.parentCourse).sql_id}, ${professorMap.get(period.profTaking).sql_id}, ${roomMap.get(period.roomUsed).sql_id}, ${period.periodLength}, ${period.periodFrequency})`
        }else{
            sql_string_l = "INSERT INTO \`period\`(name, course_id, professor_id, room_id, length, frequency, set_time) VALUES "
            sql_string_r = `("${period.periodName}", ${courseMap.get(period.parentCourse).sql_id}, ${professorMap.get(period.profTaking).sql_id}, ${roomMap.get(period.roomUsed).sql_id}, ${period.periodLength}, ${period.periodFrequency}, ${period.periodTime})`
        }
        period.sql_id = (await async_get_query(sql_string_l + sql_string_r)).insertId;
        await insert_many_hlpr("period_group", period.sql_id, period.groupsAttending.map(x => groupMap.get(x).sql_id));
        await insert_many_hlpr("period_ban_times", period.sql_id, period.periodAntiTime);
    }
    connection.end();
}
main(1, "databaseClone/thapar.json");