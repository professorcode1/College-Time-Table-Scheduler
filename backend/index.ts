require('dotenv').config();
import express from "express";
import path from "path";
import bodyParser from "body-parser";
import {  college_scheduler_connection, web_telemetry_connection } from "./src/connections";
import { GetNewTokenCallback, PostWebTelemetryCallback, ViewWebTelemetry } from "./src/webTelemetry/main";
import { Authenticate, LoginRoute, RegisterRoute } from "./src/college scheduler/auth";
import { extend_id_to_24_char, groupBy } from "./src/college scheduler/utils";
import { async_get_query } from "./src/utils/db";
import { SetParameter } from "./src/college scheduler/parameter";
import { CreateProfessor, DeleteProfessor } from "./src/college scheduler/professor";
import { CreateGroup, DeletGroup } from "./src/college scheduler/group";
import { CreateRoom, DeletRoom } from "./src/college scheduler/room";
import { CourseAssetsNameList, CreateCourse, DeleteCourse } from "./src/college scheduler/course";
import { CreatePeriod, DeletePeriod } from "./src/college scheduler/Period";
import { GetSchedule, GetUserObject, PostSchedule } from "./src/college scheduler/Schedule";
import bcrypt from "bcrypt"

// @ts-ignore
const cookieparse = require("cookie-parser")


web_telemetry_connection.connect();



const app = express()
var cors = require('cors');
app.use(cors({
    credentials: true,
    origin: "http://localhost:3000",
    methods: ["POST", "PUT", "GET", "OPTIONS", "HEAD"],
}));

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/static', express.static(__dirname + '/build/static'));
app.use(cookieparse());

//
app.get("/collegeSchduler", (req, res)=>{
    res.sendFile(path.join(__dirname,'build', 'college index.html'));
})
app.post("/collegeSchduler/login", LoginRoute);
app.post("/collegeSchduler/register", RegisterRoute);
app.get("/collegeSchduler/AmIAuthenticated", Authenticate, (req, res) => {
    return res.status(200).send();
});
app.post("/collegeSchduler/parameter", Authenticate, SetParameter);

app.post("/collegeSchduler/professor", Authenticate, CreateProfessor);
app.get("/collegeSchduler/deleteProfessor/:professorId", Authenticate, DeleteProfessor);

app.get("/collegeSchduler/deleteGroup/:groupId", Authenticate, DeletGroup);
app.post("/collegeSchduler/group", Authenticate, CreateGroup);

app.get("/collegeSchduler/deleteroom/:roomId", Authenticate, DeletRoom);
app.post("/collegeSchduler/room", Authenticate, CreateRoom);

app.get("/collegeSchduler/deleteCourse/:courseId", Authenticate, DeleteCourse);
app.post("/collegeSchduler/course", Authenticate, CreateCourse);
app.get("/collegeSchduler/CourseAssets/:courseId", Authenticate,CourseAssetsNameList)

app.get("/collegeSchduler/deletePeriod/:periodId", Authenticate, DeletePeriod);
app.post("/collegeSchduler/period", Authenticate, CreatePeriod);

app.get("/collegeSchduler/userDatabaseObject", Authenticate, GetUserObject);
app.post("/collegeSchduler/generateSchedule",Authenticate, PostSchedule);
app.get("/collegeSchduler/generateSchedule", (req, res)=>{
    res.sendFile(path.join(__dirname, "webPages","waitingAnt.html"));
});
app.get("/particles.js-master/demo/js/app.js", (req, res) =>{
    res.sendFile(path.join(__dirname, "build","static", "particles.js-master","demo", "js", "app.js"));
});
app.get("/collegeSchduler/particles.js-master/particles.js", (req, res) =>{
    res.sendFile(path.join(__dirname, "build","static", "particles.js-master","particles.js"));
});
app.get("/collegeSchduler/ant-colonoy-webambly/scheduler.js", (req, res)=>{
    res.sendFile(path.join(__dirname, "build","static", "ant-colonoy-webambly", "scheduler.js"));
})
app.get("/collegeSchduler/ant-colonoy-webambly/ant_colony.js", (req, res)=>{
    res.sendFile(path.join(__dirname, "build","static", "ant-colonoy-webambly", "ant_colony.js"));
});
app.get("/collegeSchduler/ant-colonoy-webambly/ant_colony.wasm", (req, res)=>{
    res.sendFile(path.join(__dirname, "build","static", "ant-colonoy-webambly", "ant_colony.wasm"));
});
app.get("/collegeSchduler/graph/lib/graph.js", (req, res)=>{
    res.sendFile(path.join(__dirname, "build","static", "graph", "lib", "graph.js"));
});
app.get("/collegeSchduler/viewSchedules", async (req, res)=>{
    try {
        const scheduleArray = await async_get_query("SELECT `name` AS instituteName,email, university_id AS _id FROM university", college_scheduler_connection);
        res.status(200).send(scheduleArray)
    } catch (error) {
        console.error(error);
        res.status(500).send();
    }
})
app.get("/collegeSchduler/schedule/:userId", GetSchedule);

app.listen(process.env.PORT, ()=>{
    console.log("server is listening ")
});