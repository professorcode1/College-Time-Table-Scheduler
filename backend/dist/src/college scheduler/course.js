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
exports.CourseAssetsNameList = exports.DeleteCourse = exports.CreateCourse = void 0;
const db_1 = require("../utils/db");
const connections_1 = require("../connections");
const utils_1 = require("./utils");
function DeleteCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield (0, db_1.async_get_query)("DELETE FROM course WHERE course_id = " + connections_1.college_scheduler_connection.escape(req.params.courseId), connections_1.college_scheduler_connection);
            return res.status(200).send();
        }
        catch (error) {
            console.error(error);
            return res.status(500).send();
        }
    });
}
exports.DeleteCourse = DeleteCourse;
function CreateCourse(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let taughtBy = new Array(0), taughtTo = new Array(0);
            for (const key in req.body) {
                if (req.body[key] === "on") {
                    if (key[0] === 'P')
                        taughtBy.push(key.substring(1, key.length)); //key is of a professor
                    else
                        taughtTo.push(key.substring(1, key.length)); //key is of a group
                }
            }
            taughtBy = taughtBy.map(x => Number(x));
            taughtTo = taughtTo.map(x => Number(x));
            if (taughtTo.length == 0 || taughtBy.length == 0)
                return res.redirect("/course");
            const thisCourseId = (yield (0, db_1.async_push_query)("INSERT INTO course SET ?", {
                university_id: req.user.university_id,
                name: req.body.courseName
            }, connections_1.college_scheduler_connection)).insertId;
            yield (0, utils_1.insert_many_hlpr)("course_professor", thisCourseId, taughtBy, connections_1.college_scheduler_connection);
            yield (0, utils_1.insert_many_hlpr)("course_group", thisCourseId, taughtTo, connections_1.college_scheduler_connection);
            return res.status(200).send();
        }
        catch (error) {
            console.error(error);
            return res.status(500).send();
        }
    });
}
exports.CreateCourse = CreateCourse;
function CourseAssetsNameList(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const prof_id = yield (0, db_1.async_get_query)(`
            SELECT professor_id FROM course_professor 
            where course_id = ${connections_1.college_scheduler_connection.escape(req.params.courseId)}
        `, connections_1.college_scheduler_connection);
            const group_ids = yield (0, db_1.async_get_query)(`
            SELECT group_id FROM course_group 
            where course_id = ${connections_1.college_scheduler_connection.escape(req.params.courseId)}
        `, connections_1.college_scheduler_connection);
            return res.send({ prof_id: prof_id.map((x) => x.professor_id), group_ids: group_ids.map((x) => x.group_id) });
        }
        catch (error) {
            return res.status(500).send();
        }
    });
}
exports.CourseAssetsNameList = CourseAssetsNameList;
