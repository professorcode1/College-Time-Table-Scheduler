import { Request, Response } from "express";
import { async_get_query, async_push_query } from "../utils/db";
import { college_scheduler_connection } from "../connections";

const SetParameter = async (req:Request, res:Response) => {
    const sql_string = "CALL update_paramterers(" + 
        (req as any).user.university_id + ',' + college_scheduler_connection.escape(req.body.periods_per_day) + ',' + college_scheduler_connection.escape(req.body.days_per_week) + ')';
    try {
        await async_get_query(sql_string, college_scheduler_connection);
        return res.status(200).send();        
    } catch (error) {
        console.log(error)
        return res.status(500).send();
    }
}

export {SetParameter}