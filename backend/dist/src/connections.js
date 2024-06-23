"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.college_scheduler_connection = exports.web_telemetry_connection = void 0;
const mysql_1 = __importDefault(require("mysql"));
const WebTelemetryConnetionConfig = {
    host: process.env.DBHOST,
    port: Number(process.env.DBPORT),
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.WEBTELDBNAME
};
const CollegeSchedulerConfig = {
    host: process.env.DBHOST,
    port: Number(process.env.DBPORT),
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.CollegeScheudlerDBName
};
const web_telemetry_connection = mysql_1.default.createConnection(WebTelemetryConnetionConfig);
exports.web_telemetry_connection = web_telemetry_connection;
const college_scheduler_connection = mysql_1.default.createConnection(CollegeSchedulerConfig);
exports.college_scheduler_connection = college_scheduler_connection;
