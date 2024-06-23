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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configDotEnv_1 = require("./src/utils/configDotEnv");
(0, configDotEnv_1.configure_dotnev)();
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const body_parser_1 = __importDefault(require("body-parser"));
const connections_1 = require("./src/connections");
const auth_1 = require("./src/college scheduler/auth");
const db_1 = require("./src/utils/db");
const parameter_1 = require("./src/college scheduler/parameter");
const professor_1 = require("./src/college scheduler/professor");
const group_1 = require("./src/college scheduler/group");
const room_1 = require("./src/college scheduler/room");
const course_1 = require("./src/college scheduler/course");
const Period_1 = require("./src/college scheduler/Period");
const Schedule_1 = require("./src/college scheduler/Schedule");
// @ts-ignore
const cookieparse = require("cookie-parser");
const app = (0, express_1.default)();
// var cors = require('cors');
// app.use(cors({
//     credentials: true,
//     origin: "http://localhost:3000",
//     methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
// }));
const build_path = (0, configDotEnv_1.get_build_path)();
const waiting_ant_page_path = (0, configDotEnv_1.get_waiting_ant_path)();
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use('/collegeSchduler/static', express_1.default.static(path_1.default.join(build_path, 'static')));
app.use(cookieparse());
//
app.get("/collegeSchduler", (req, res) => {
    res.sendFile(path_1.default.join(build_path, 'index.html'));
});
app.post("/collegeSchduler/login", auth_1.LoginRoute);
app.post("/collegeSchduler/register", auth_1.RegisterRoute);
app.get("/collegeSchduler/AmIAuthenticated", auth_1.Authenticate, (req, res) => {
    return res.status(200).send();
});
app.post("/collegeSchduler/parameter", auth_1.Authenticate, parameter_1.SetParameter);
app.post("/collegeSchduler/professor", auth_1.Authenticate, professor_1.CreateProfessor);
app.get("/collegeSchduler/deleteProfessor/:professorId", auth_1.Authenticate, professor_1.DeleteProfessor);
app.get("/collegeSchduler/deleteGroup/:groupId", auth_1.Authenticate, group_1.DeletGroup);
app.post("/collegeSchduler/group", auth_1.Authenticate, group_1.CreateGroup);
app.get("/collegeSchduler/deleteroom/:roomId", auth_1.Authenticate, room_1.DeletRoom);
app.post("/collegeSchduler/room", auth_1.Authenticate, room_1.CreateRoom);
app.get("/collegeSchduler/deleteCourse/:courseId", auth_1.Authenticate, course_1.DeleteCourse);
app.post("/collegeSchduler/course", auth_1.Authenticate, course_1.CreateCourse);
app.get("/collegeSchduler/CourseAssets/:courseId", auth_1.Authenticate, course_1.CourseAssetsNameList);
app.get("/collegeSchduler/deletePeriod/:periodId", auth_1.Authenticate, Period_1.DeletePeriod);
app.post("/collegeSchduler/period", auth_1.Authenticate, Period_1.CreatePeriod);
app.get("/collegeSchduler/userDatabaseObject", auth_1.Authenticate, Schedule_1.GetUserObject);
app.post("/collegeSchduler/generateSchedule", auth_1.Authenticate, Schedule_1.PostSchedule);
app.get("/collegeSchduler/generateSchedule", (req, res) => {
    res.sendFile(waiting_ant_page_path);
});
app.get("/particles.js-master/demo/js/app.js", (req, res) => {
    res.sendFile(path_1.default.join(build_path, "static", "particles.js-master", "demo", "js", "app.js"));
});
app.get("/collegeSchduler/particles.js-master/particles.js", (req, res) => {
    res.sendFile(path_1.default.join(build_path, "static", "particles.js-master", "particles.js"));
});
app.get("/collegeSchduler/ant-colonoy-webambly/scheduler.js", (req, res) => {
    res.sendFile(path_1.default.join(build_path, "static", "ant-colonoy-webambly", "scheduler.js"));
});
app.get("/collegeSchduler/ant-colonoy-webambly/ant_colony.js", (req, res) => {
    res.sendFile(path_1.default.join(build_path, "static", "ant-colonoy-webambly", "ant_colony.js"));
});
app.get("/collegeSchduler/ant-colonoy-webambly/ant_colony.wasm", (req, res) => {
    res.sendFile(path_1.default.join(build_path, "static", "ant-colonoy-webambly", "ant_colony.wasm"));
});
app.get("/collegeSchduler/graph/lib/graph.js", (req, res) => {
    res.sendFile(path_1.default.join(build_path, "static", "graph", "lib", "graph.js"));
});
app.get("/collegeSchduler/viewSchedules", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const scheduleArray = yield (0, db_1.async_get_query)("SELECT `name` AS instituteName,email, university_id AS _id FROM university", connections_1.college_scheduler_connection);
        res.status(200).send(scheduleArray);
    }
    catch (error) {
        console.error(error);
        res.status(500).send();
    }
}));
app.get("/collegeSchduler/schedule/:userId", Schedule_1.GetSchedule);
app.listen(process.env.PORT, () => {
    console.log(`server is listening is listening on  ${process.env.PORT}`);
});
