import mysql from "mysql"

const CollegeSchedulerConfig = {
    host     : process.env.DBHOST,
    port     : Number(process.env.DBPORT),
    user     : process.env.DBUSER,
    password : process.env.DBPASS,
    database : process.env.CollegeScheudlerDBName
}
const college_scheduler_connection = mysql.createConnection(CollegeSchedulerConfig);
export {college_scheduler_connection}