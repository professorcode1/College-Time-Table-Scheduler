import fs from "fs"
import { Connection } from "mysql";
import path from "path"
import { async_get_query } from "../utils/db";
import { insert_many_hlpr } from "./utils";

async function write_thapars_record_to_db(
    university_id:string, 
    connection:Connection,
    json_file:string="thapar.json",
){
    const database_json_Obj = JSON.parse(await fs.promises.readFile(path.join(__dirname, json_file), 'utf-8'));
    await async_get_query(
        `UPDATE university SET periods_per_day = ${database_json_Obj.periodsPerDay}, days_per_week = ${database_json_Obj.numberOfDays} WHERE university_id = ${university_id}`,
        connection
    );
    const groupMap = new Map();
    const roomMap = new Map();
    const professorMap = new Map();
    const courseMap = new Map();
    for(let room of database_json_Obj.rooms){
        room.sql_id = (await async_get_query(
            `INSERT INTO room(university_id, name, capacity) VALUES (${university_id}, "${room.roomName}", ${room.roomCapacity})`,
            connection 
        )).insertId;
        await insert_many_hlpr("room_ban_times", room.sql_id, room.unAvialability, connection);
        roomMap.set(room._id, room);
    }
    for(let professor of database_json_Obj.professors){
        professor.sql_id = (await async_get_query(`INSERT INTO professor(university_id,name) VALUES (${university_id}, "${professor.profName}")`, connection)).insertId;
        await insert_many_hlpr("professor_ban_times", professor.sql_id, professor.unAvialability, connection);
        professorMap.set(professor._id, professor);
    }
    for(let group of database_json_Obj.groups){
        group.sql_id = (await async_get_query(`INSERT INTO \`group\`(university_id, name, number_of_students) VALUES (${university_id},"${group.groupName}", ${group.groupQuantity})`, connection)).insertId;
        await insert_many_hlpr("group_ban_times", group.sql_id, group.unAvialability, connection);
        groupMap.set(group._id, group);
    }
    for(let course of database_json_Obj.courses){
        course.sql_id = (await async_get_query(`INSERT INTO course(university_id, name) VALUES (${university_id},"${course.courseName}")`, connection)).insertId;
        for(let profId of course.taughtBy){
            await async_get_query(`INSERT INTO course_professor VALUES (${course.sql_id}, ${professorMap.get(profId).sql_id})`, connection);
        }
        for(let groupId of course.taughtTo){
            await async_get_query(`INSERT INTO course_group VALUES (${course.sql_id}, ${groupMap.get(groupId).sql_id})`, connection);
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
        period.sql_id = (await async_get_query(sql_string_l + sql_string_r, connection)).insertId;
        await insert_many_hlpr("period_group", period.sql_id, period.groupsAttending.map((x:string) => groupMap.get(x).sql_id),connection);
        await insert_many_hlpr("period_ban_times", period.sql_id, period.periodAntiTime,connection);
    }
}

export {write_thapars_record_to_db}