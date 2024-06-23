"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.college_scheduler_connection = void 0;
const mysql_1 = __importDefault(require("mysql"));
const CollegeSchedulerConfig = {
    host: process.env.DBHOST,
    port: Number(process.env.DBPORT),
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.CollegeScheudlerDBName
};
const college_scheduler_connection = mysql_1.default.createConnection(CollegeSchedulerConfig);
exports.college_scheduler_connection = college_scheduler_connection;
