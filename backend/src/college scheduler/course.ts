import { Request, Response } from "express";
import { async_get_query, async_push_query } from "../utils/db";
import { college_scheduler_connection } from "../connections";
import { insert_many_hlpr } from "./utils";

async function DeleteCourse(req:Request, res:Response){
    try {
        await async_get_query("DELETE FROM course WHERE course_id = " + college_scheduler_connection.escape(req.params.courseId), college_scheduler_connection);        
        return res.status(200).send();
    } catch (error) {
        console.error(error);
        return res.status(500).send();
    }
}

async function CreateCourse(req:Request, res:Response){
    try {
        let taughtBy = new Array(0),
        taughtTo = new Array(0);
        for (const key in req.body){
            if (req.body[key] === "on"){
                if (key[0] === 'P')
                    taughtBy.push(key.substring(1, key.length)); //key is of a professor
                else
                   taughtTo.push(key.substring(1, key.length)); //key is of a group
            }
        }
        taughtBy = taughtBy.map(x => Number(x));
        taughtTo = taughtTo.map(x => Number(x));
        if (taughtTo.length == 0 || taughtBy.length == 0)
        return res.redirect("/course");
        const thisCourseId = (await async_push_query("INSERT INTO course SET ?", {
        university_id: (req as any).user.university_id,
        name: req.body.courseName
        }, college_scheduler_connection)).insertId;
        await insert_many_hlpr("course_professor", thisCourseId, taughtBy, college_scheduler_connection);
        await insert_many_hlpr("course_group", thisCourseId, taughtTo, college_scheduler_connection);
        return res.status(200).send();        
    } catch (error) {
        console.error(error);
        return res.status(500).send();
    }

}

async function CourseAssetsNameList(req:Request, res:Response){
    try {
        const prof_id = await async_get_query(`
            SELECT professor_id FROM course_professor 
            where course_id = ${college_scheduler_connection.escape(req.params.courseId)}
        `, college_scheduler_connection);
        const group_ids = await async_get_query(`
            SELECT group_id FROM course_group 
            where course_id = ${college_scheduler_connection.escape(req.params.courseId)}
        `, college_scheduler_connection)
        return res.send({prof_id:prof_id.map((x:any) => x.professor_id),group_ids:group_ids.map((x:any)=> x.group_id)})
    } catch (error) {
        return res.status(500).send();
    }
}

export {CreateCourse, DeleteCourse, CourseAssetsNameList}