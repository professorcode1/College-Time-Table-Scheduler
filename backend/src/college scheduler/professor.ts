import { Request, Response } from "express";
import { async_get_query, async_push_query } from "../utils/db";
import { college_scheduler_connection } from "../connections";
import { insert_many_hlpr } from "./utils";

const DeleteProfessor = async (req:Request, res:Response) => {
    try {
        await async_get_query("DELETE FROM professor WHERE professor_id = " + college_scheduler_connection.escape(req.params.professorId), college_scheduler_connection);
        return res.status(200).send();
    } catch (error) {
        return res.status(500).send();
    }
}

const CreateProfessor =  async (req:Request, res:Response) => {
    try {
        const unAvialability:number[] = new Array(0);
        for (let loopitrt = 0; loopitrt < req.body.days_per_week * req.body.periods_per_day; loopitrt++)
            if (req.body["periodTaken" + String(loopitrt)] === "on")
                unAvialability.push(loopitrt);
        const professor_id = (await async_push_query("INSERT INTO professor SET ?", {
            university_id: (req as any).user.university_id,
            name: req.body.profName
        }, college_scheduler_connection)).insertId;
        await insert_many_hlpr("professor_ban_times", professor_id, unAvialability, college_scheduler_connection);
    } catch (error) {
        res.status(500).send();
    }
    return res.status(200).send();

}

export {DeleteProfessor, CreateProfessor}