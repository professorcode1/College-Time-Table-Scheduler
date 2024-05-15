import mysql from "mysql"
const WebTelemetryConnetionConfig = {
    host     : process.env.DBHOST,
    port     : Number(process.env.DBPORT),
    user     : process.env.DBUSER,
    password : process.env.DBPASS,
    database : process.env.WEBTELDBNAME
};
const CollegeSchedulerConfig = {
    host     : process.env.DBHOST,
    port     : Number(process.env.DBPORT),
    user     : process.env.DBUSER,
    password : process.env.DBPASS,
    database : process.env.CollegeScheudlerDBName
}
const web_telemetry_connection = mysql.createConnection(WebTelemetryConnetionConfig);
const college_scheduler_connection = mysql.createConnection(CollegeSchedulerConfig);
export {web_telemetry_connection, college_scheduler_connection}