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
exports.GetSchedule = exports.GetUserObject = exports.PostSchedule = void 0;
const db_1 = require("../utils/db");
const connections_1 = require("../connections");
const utils_1 = require("./utils");
function user_have_scheduler(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const [_, prof_views] = yield (0, db_1.async_get_query)(`CALL view_schedule(${connections_1.college_scheduler_connection.escape(userId)})`, connections_1.college_scheduler_connection);
        return prof_views.length !== 0;
    });
}
function GetUserObject(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { university_id } = req.user;
        const [[user_Object], rooms_data, room_ban_times, groups_data, group_ban_times, professors_data, professor_ban_times, courses_data, period_data, period_group, period_ban_times] = yield (0, db_1.async_get_query)(`CALL entire_university_information(${connections_1.college_scheduler_connection.escape(university_id)})`, connections_1.college_scheduler_connection);
        const room_ban_times_grouped = (0, utils_1.groupBy)(room_ban_times, x => x.room_id);
        const group_ban_times_grouped = (0, utils_1.groupBy)(group_ban_times, x => x.group_id);
        const professor_ban_times_grouped = (0, utils_1.groupBy)(professor_ban_times, x => x.professor_id);
        const period_group_grouped = (0, utils_1.groupBy)(period_group, x => x.period_id);
        const period_ban_times_grouped = (0, utils_1.groupBy)(period_ban_times, x => x.period_id);
        const room_map = new Map();
        const professor_map = new Map();
        const group_map = new Map();
        for (let room of rooms_data) {
            room_map.set(room._id, room);
            if (room_ban_times_grouped.has(room._id)) {
                room.unAvialability = room_ban_times_grouped.get(room._id).map((x) => x.ban_time);
            }
            else {
                room.unAvialability = [];
            }
            room.periodsUsedIn = [];
        }
        for (let group of groups_data) {
            group_map.set(group._id, group);
            if (group_ban_times_grouped.has(group._id)) {
                group.unAvialability = group_ban_times_grouped.get(group._id).map((x) => x.ban_time);
            }
            else {
                group.unAvialability = [];
            }
            group.periodsAttended = [];
        }
        for (let professor of professors_data) {
            professor_map.set(professor._id, professor);
            if (professor_ban_times_grouped.has(professor._id)) {
                professor.unAvialability = professor_ban_times_grouped.get(professor._id).map((x) => x.ban_time);
            }
            else {
                professor.unAvialability = [];
            }
            professor.periodsTaken = [];
        }
        for (let period of period_data) {
            period.groupsAttending = (_a = period_group_grouped.get(period._id)) === null || _a === void 0 ? void 0 : _a.map((x) => x.group_id);
            if (period_ban_times_grouped.has(period._id))
                period.periodAntiTime = period_ban_times_grouped.get(period._id).map((x) => x.ban_time);
            else
                period.periodAntiTime = [];
            period._id = (0, utils_1.extend_id_to_24_char)(period._id);
            room_map.get(period.roomUsed).periodsUsedIn.push(period._id);
            professor_map.get(period.profTaking).periodsTaken.push(period._id);
            if (period.groupsAttending === undefined)
                period.groupsAttending = [];
            for (let group_id of period.groupsAttending)
                group_map.get(group_id).periodsAttended.push(period._id);
        }
        user_Object.rooms = rooms_data;
        user_Object.professors = professors_data;
        user_Object.groups = groups_data;
        user_Object.courses = courses_data;
        user_Object.periods = period_data;
        user_Object.schedule_exists = yield user_have_scheduler(university_id);
        res.send(user_Object);
    });
}
exports.GetUserObject = GetUserObject;
function PostSchedule(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const coloring = req.body;
        // console.log(coloring);
        try {
            let sql_string_r = "";
            for (let period_Info in coloring) {
                let [period_id, length_value, frequency_value] = period_Info.match(/\d+/g);
                let color = coloring[period_Info];
                sql_string_r += `(${period_id}, ${length_value}, ${frequency_value}, ${color}),`;
            }
            const ValidPeriodColoringValuesRegexp = /^(\(\d+,\s\d+,\s\d+,\s\d+\)(,?))*$/;
            const ColoringValue = sql_string_r.substring(0, sql_string_r.length - 1);
            if (!ValidPeriodColoringValuesRegexp.test(ColoringValue)) {
                return res.status(401).send("Broh the source code it literally on github what you sql injecting this for!?!?!?!😭😭");
            }
            yield (0, db_1.async_get_query)(`CALL delete_university_schedule(${connections_1.college_scheduler_connection.escape(req.user.university_id)})`, connections_1.college_scheduler_connection);
            yield (0, db_1.async_get_query)("INSERT INTO period_coloring VALUES " + ColoringValue, connections_1.college_scheduler_connection);
        }
        catch (err) {
            console.log(err);
            return res.send({ success: false, err });
        }
        return res.send({ success: true, _id: req.user.university_id });
    });
}
exports.PostSchedule = PostSchedule;
function GetSchedule(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const [prof_data, prof_views, group_data, group_views,] = yield (0, db_1.async_get_query)(`CALL view_schedule(${connections_1.college_scheduler_connection.escape(req.params.userId)})`, connections_1.college_scheduler_connection);
            const prof_views_grouped = (0, utils_1.groupBy)(prof_views, x => x.professor_id);
            const group_views_grouped = (0, utils_1.groupBy)(group_views, x => x.group_id);
            const { numberOfDays, periodsPerDay } = (yield (0, db_1.async_get_query)(`SELECT days_per_week AS numberOfDays, periods_per_day AS periodsPerDay FROM university WHERE university_id = ${connections_1.college_scheduler_connection.escape(req.params.userId)}`, connections_1.college_scheduler_connection))[0];
            let sendTable = new Map();
            for (let prof of prof_data) {
                let table = new Array(numberOfDays);
                for (let i = 0; i < numberOfDays; i++)
                    table[i] = new Array(periodsPerDay);
                for (let i = 0; i < numberOfDays; i++)
                    for (let j = 0; j < periodsPerDay; j++)
                        table[i][j] = "Free Period";
                if (prof_views_grouped.has(prof.professor_id)) {
                    for (let period of prof_views_grouped.get(prof.professor_id)) {
                        // console.log(period);
                        table[Math.floor(period.color / periodsPerDay)][period.color % periodsPerDay] = period.name;
                    }
                }
                sendTable.set(prof.name, table);
            }
            for (let group of group_data) {
                let table = new Array(numberOfDays);
                for (let i = 0; i < numberOfDays; i++)
                    table[i] = new Array(periodsPerDay);
                for (let i = 0; i < numberOfDays; i++)
                    for (let j = 0; j < periodsPerDay; j++)
                        table[i][j] = "Free Period";
                if (group_views_grouped.has(group.group_id)) {
                    for (let period of group_views_grouped.get(group.group_id)) {
                        table[Math.floor(period.color / periodsPerDay)][period.color % periodsPerDay] = period.name;
                    }
                }
                sendTable.set(group.name, table);
            }
            return res.send(Object.fromEntries(sendTable.entries()));
        }
        catch (error) {
            return res.status(500).send();
        }
    });
}
exports.GetSchedule = GetSchedule;
