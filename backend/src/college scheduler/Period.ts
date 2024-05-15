import { Request, Response } from "express";
import { college_scheduler_connection } from "../connections";
import { async_get_query, async_push_query } from "../utils/db";
import { insert_many_hlpr } from "./utils";

async function DeletePeriod(req:Request, res:Response) {
    
    try {
        //no need for protection against sql injection because the regex itself would remove all non digits
        await async_get_query(`DELETE FROM \`period\` WHERE period_id = '${req.params.periodId.replace(/^\D+/g, '')}'`, college_scheduler_connection);
        return res.status(200).send();
    } catch (error) {
        console.error(error)
        return res.status(500).send();
    }
}

async function CreatePeriod(req:Request, res:Response){
    try {
        let group_ids = [];
        for(let key in req.body){
            if(!isNaN(key as unknown as number) && req.body[key] === "on"){
                group_ids.push(Number(key));
            }
        }
        const numberOfDays = req.body.days_per_week;
        const periodsPerDay = req.body.periods_per_day;
        let ban_times = []
        for(let iter = 0 ; iter < numberOfDays * periodsPerDay ; iter++){
            if(req.body["periodTaken" + iter] === "on"){
                ban_times.push(iter);
            }
        }
        let period_Obj:any = new Object();
        period_Obj.name = req.body.periodName;
        period_Obj.course_id = req.body.courseId;
        period_Obj.professor_id = req.body.profId;
        period_Obj.room_id = req.body.roomId;
        period_Obj.length = req.body.periodLength
        period_Obj.frequency = req.body.periodFrequency;
        if(req.body.specifyTime){
            period_Obj.set_time = periodsPerDay * (Number(req.body.timeSpeicifiedDay) - 1) + Number(req.body.timeSpeicifiedPeriod) - 1;
        }
        const period_id = (await async_push_query("INSERT INTO `period` SET ?", period_Obj, college_scheduler_connection)).insertId;
        if(!req.body.specifyTime){
            await insert_many_hlpr("period_ban_times", period_id, ban_times, college_scheduler_connection);
        }
        await insert_many_hlpr("period_group", period_id, group_ids, college_scheduler_connection);
        return res.status(200).send();
    } catch (error) {
        console.error(error)
        return res.status(500).send();
    }

}

export {CreatePeriod, DeletePeriod}