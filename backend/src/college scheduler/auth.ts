import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt"
import { async_get_query, async_push_query } from "../utils/db";
import { college_scheduler_connection } from "../connections";
import { write_thapars_record_to_db } from "./write_thapar_records_to_db";
import jwt from "jsonwebtoken"

const Authenticate = async (req:Request, res:Response, next:NextFunction) => {
    const token = req.cookies.token;
    try {
        const {university_id} = jwt.verify(token, process.env.JWTEncryptionToken as string) as any;
        // @ts-ignore
        req.user = {university_id};
        next();  
    } catch (error) {
        return res.status(403).send("invalid/expired token");
    }
}

const LoginRoute = async (req:Request, res:Response) => {
    const query_ = `
    SELECT university_id, password as hashedPassword
    FROM university 
    WHERE email = ${college_scheduler_connection.escape(req.body.email)}
    `;
    const users_list = await async_get_query(
        query_,
        college_scheduler_connection
    )
    if (users_list.length === 0) {
        return res.status(401).send("Invalid username"); 
    }
    const {university_id, hashedPassword} = users_list[0];
    if(!(await bcrypt.compare(req.body.password, hashedPassword))){
        return res.status(401).send("Invalid password");
    }
    const token = jwt.sign({university_id}, process.env.JWTEncryptionToken as string, {expiresIn:"8h"});
    res.status(200).send(token);
}

const RegisterRoute = async (req:Request, res:Response) => {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            if ((await async_get_query(
                "SELECT EXISTS(SELECT * FROM university WHERE email = " + college_scheduler_connection.escape(req.body.email) + ") AS email_used", college_scheduler_connection)
            )[0].email_used) {
                return res.status(400).send("This email is already in use"); 
            }
            const university_query_result = await async_push_query("INSERT INTO university SET ?", {
                name: req.body.instituteName,
                email: req.body.email,
                password: hashedPassword
            }, college_scheduler_connection);
            const university_id = university_query_result.insertId;
            if(req.body.useSample){
                await write_thapars_record_to_db(university_id, college_scheduler_connection)
            }
            const token = jwt.sign({university_id}, process.env.JWTEncryptionToken as string, {expiresIn:"8h"});
            res.status(200).send(token);
        } catch (err) {
            console.log(err)
            res.status(500).send("Some internal error occured");
        }
}

export {LoginRoute, RegisterRoute, Authenticate}