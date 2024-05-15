import { Request, Response } from "express";
import { getCurrentTimeFromInterntionalServer } from "../utils/getTimeFromServer";
import { v4 as uuidv4 } from 'uuid';
import { web_telemetry_connection } from "../connections";
import { async_get_query, async_push_query } from "../utils/db";
import bcrypt from "bcrypt";
const GetNewTokenCallback  = async (req:Request, res:Response)=>{
    const sessionId = uuidv4();
    res.send(sessionId);
    try {
        const time = await getCurrentTimeFromInterntionalServer();        
        await async_push_query("INSERT INTO session_id SET ?", {
            time,
            sessionId
        }, web_telemetry_connection);
    } catch (error) {
        console.error(error)
    }
}

const PostWebTelemetryCallback = async (req:Request, res:Response)=>{
    res.send();
    try {
        await async_push_query("INSERT INTO Pageview SET ?", req.body, web_telemetry_connection);
            
    } catch (error) {
        console.error(error);
    }

};
const ViewWebTelemetry = async (req:Request, res:Response) => {
    if(!bcrypt.compareSync(req.body.password, process.env.WebTelemetryPassword!)){
        return res.status(401).send();
    };
    const time_compare_string = web_telemetry_connection.escape(`${req.body.year}-${String(req.body.month).padStart(2, "0")}%`);
    const sessions = await async_get_query(`
        SELECT * FROM session_id
        WHERE time like 
        ${time_compare_string}
        order by time
    `, web_telemetry_connection);
    const pageview = await async_get_query(`
        select Pageview.* 
        from session_id 
        inner join Pageview 
        on Pageview.sessionId = session_id.sessionId
        where session_id.time like ${time_compare_string}
        order by Pageview.time
    `, web_telemetry_connection);
    return res.send({sessions, pageview})
}
export {
    GetNewTokenCallback,
    PostWebTelemetryCallback,
    ViewWebTelemetry
}