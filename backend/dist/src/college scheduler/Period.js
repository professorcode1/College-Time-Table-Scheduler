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
exports.DeletePeriod = exports.CreatePeriod = void 0;
const connections_1 = require("../connections");
const db_1 = require("../utils/db");
const utils_1 = require("./utils");
function DeletePeriod(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            //no need for protection against sql injection because the regex itself would remove all non digits
            yield (0, db_1.async_get_query)(`DELETE FROM \`period\` WHERE period_id = '${req.params.periodId.replace(/^\D+/g, '')}'`, connections_1.college_scheduler_connection);
            return res.status(200).send();
        }
        catch (error) {
            console.error(error);
            return res.status(500).send();
        }
    });
}
exports.DeletePeriod = DeletePeriod;
function CreatePeriod(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let group_ids = [];
            for (let key in req.body) {
                if (!isNaN(key) && req.body[key] === "on") {
                    group_ids.push(Number(key));
                }
            }
            const numberOfDays = req.body.days_per_week;
            const periodsPerDay = req.body.periods_per_day;
            let ban_times = [];
            for (let iter = 0; iter < numberOfDays * periodsPerDay; iter++) {
                if (req.body["periodTaken" + iter] === "on") {
                    ban_times.push(iter);
                }
            }
            let period_Obj = new Object();
            period_Obj.name = req.body.periodName;
            period_Obj.course_id = req.body.courseId;
            period_Obj.professor_id = req.body.profId;
            period_Obj.room_id = req.body.roomId;
            period_Obj.length = req.body.periodLength;
            period_Obj.frequency = req.body.periodFrequency;
            if (req.body.specifyTime) {
                period_Obj.set_time = periodsPerDay * (Number(req.body.timeSpeicifiedDay) - 1) + Number(req.body.timeSpeicifiedPeriod) - 1;
            }
            const period_id = (yield (0, db_1.async_push_query)("INSERT INTO `period` SET ?", period_Obj, connections_1.college_scheduler_connection)).insertId;
            if (!req.body.specifyTime) {
                yield (0, utils_1.insert_many_hlpr)("period_ban_times", period_id, ban_times, connections_1.college_scheduler_connection);
            }
            yield (0, utils_1.insert_many_hlpr)("period_group", period_id, group_ids, connections_1.college_scheduler_connection);
            return res.status(200).send();
        }
        catch (error) {
            console.error(error);
            return res.status(500).send();
        }
    });
}
exports.CreatePeriod = CreatePeriod;
