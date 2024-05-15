import { Request, Response } from "express";
import { async_get_query } from "../utils/db";
import { college_scheduler_connection } from "../connections";
import { extend_id_to_24_char, groupBy } from "./utils";

async function GetUserObject(req:Request,res:Response){
    const [[user_Object],
        rooms_data, room_ban_times,
        groups_data, group_ban_times,
        professors_data, professor_ban_times, 
        courses_data, 
        period_data, period_group, period_ban_times] = await async_get_query(
            `CALL entire_university_information(${college_scheduler_connection.escape(((req as any).user).university_id)})`, 
        college_scheduler_connection);

    const room_ban_times_grouped = groupBy(room_ban_times, x => x.room_id);
    const group_ban_times_grouped = groupBy(group_ban_times, x => x.group_id);
    const professor_ban_times_grouped = groupBy(professor_ban_times, x => x.professor_id);
    const period_group_grouped = groupBy(period_group, x => x.period_id);
    const period_ban_times_grouped = groupBy(period_ban_times, x => x.period_id);
    const room_map = new Map();
    const professor_map = new Map();
    const group_map = new Map();
    for(let room of rooms_data){
        room_map.set(room._id, room); 
        if(room_ban_times_grouped.has(room._id)){
            room.unAvialability = room_ban_times_grouped.get(room._id).map((x:any) => x.ban_time);
        }else{
            room.unAvialability = [];
        }
        room.periodsUsedIn = [];
    }

    for(let group of groups_data){
        group_map.set(group._id, group); 
        if(group_ban_times_grouped.has(group._id)){
            group.unAvialability = group_ban_times_grouped.get(group._id).map((x:any) => x.ban_time);
        }else{
            group.unAvialability = [];
        }
        group.periodsAttended = [];
    }

    for(let professor of professors_data){
        professor_map.set(professor._id, professor); 
        if(professor_ban_times_grouped.has(professor._id)){
            professor.unAvialability = professor_ban_times_grouped.get(professor._id).map((x:any) => x.ban_time);
        }else{
            professor.unAvialability = [];
        }
        professor.periodsTaken = [];
    }
    for(let period of period_data){
        period.groupsAttending = period_group_grouped.get(period._id)?.map((x:any) => x.group_id);
        if(period_ban_times_grouped.has(period._id))
            period.periodAntiTime = period_ban_times_grouped.get(period._id).map((x:any) => x.ban_time);
        else
            period.periodAntiTime = [];
        period._id = extend_id_to_24_char(period._id);
        room_map.get(period.roomUsed).periodsUsedIn.push(period._id);
        professor_map.get(period.profTaking).periodsTaken.push(period._id);
        if(period.groupsAttending === undefined) period.groupsAttending = []
        for(let group_id of period.groupsAttending)
            group_map.get(group_id).periodsAttended.push(period._id);
    }
    user_Object.rooms = rooms_data;
    user_Object.professors = professors_data;
    user_Object.groups = groups_data;
    user_Object.courses = courses_data;
    user_Object.periods = period_data;
    res.send(user_Object);
}

async function PostSchedule(req:Request, res:Response){
    const coloring = req.body;
    // console.log(coloring);
    try{
        let sql_string_r = "";
        for(let period_Info in coloring){
            let [period_id, length_value, frequency_value]  = period_Info.match(/\d+/g) as unknown as [number,number,number];
            let color = coloring[period_Info];
            sql_string_r += `(${period_id}, ${length_value}, ${frequency_value}, ${color}),`;
        }
        await async_get_query(`CALL delete_university_schedule(${college_scheduler_connection.escape((req as any).user.university_id)})`, college_scheduler_connection);
        await async_get_query("INSERT INTO period_coloring VALUES " + college_scheduler_connection.escape(sql_string_r.substring(0, sql_string_r.length - 1)), college_scheduler_connection);
    }catch(err){
        console.log(err);
        return res.send(err);
    }
    return res.send("done");
}
async function GetSchedule(req:Request, res:Response){
    try {
        const [prof_data, prof_views, group_data, group_views, ] = await async_get_query(`CALL view_schedule(${college_scheduler_connection.escape(req.params.userId)})`, college_scheduler_connection);
        const prof_views_grouped = groupBy(prof_views, x => x.professor_id);
        const group_views_grouped = groupBy(group_views, x => x.group_id);
        const {
            numberOfDays,
            periodsPerDay
        } = (await async_get_query(`SELECT days_per_week AS numberOfDays, periods_per_day AS periodsPerDay FROM university WHERE university_id = ${college_scheduler_connection.escape(req.params.userId)}`, college_scheduler_connection))[0];
        let sendTable = new Map();
        for(let prof of prof_data){
            let table = new Array(numberOfDays);
            for (let i = 0; i < numberOfDays; i++)
                table[i] = new Array(periodsPerDay);
            for (let i = 0; i < numberOfDays; i++)
                for (let j = 0; j < periodsPerDay; j++)
                    table[i][j] = "Free Period";
            if(prof_views_grouped.has(prof.professor_id)){
                for(let period of prof_views_grouped.get(prof.professor_id)){
                    // console.log(period);
                    table[Math.floor(period.color / periodsPerDay)][period.color % periodsPerDay] = period.name; 
                }
            }
            sendTable.set(prof.name, table);
        }
        for(let group of group_data){
            let table = new Array(numberOfDays);
            for (let i = 0; i < numberOfDays; i++)
                table[i] = new Array(periodsPerDay);
            for (let i = 0; i < numberOfDays; i++)
                for (let j = 0; j < periodsPerDay; j++)
                    table[i][j] = "Free Period";
            if(group_views_grouped.has(group.group_id)){
                for(let period of group_views_grouped.get(group.group_id)){
                    table[Math.floor(period.color / periodsPerDay)][period.color % periodsPerDay] = period.name; 
                }
            }
            sendTable.set(group.name, table);
        }
        return res.send(Object.fromEntries(sendTable.entries()));
    } catch (error) {
        return res.status(500).send();        
    }
}
export {PostSchedule, GetUserObject, GetSchedule}