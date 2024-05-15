import axios from "axios";
import { IUser } from "./UserType";
import { URLBase } from "./URLBase";

async function PostHelper(
    setWaiting:(waiting:boolean)=>void,
    setUser:(user:IUser)=>void,
    post_request_path:string,
    data:any
){
    setWaiting(true);
    try {
        await axios.post(URLBase + post_request_path, data,{
            withCredentials:true
        });
        const new_user:IUser = (await axios.get(URLBase + "/userDatabaseObject", {
            withCredentials:true
        })).data;
        setUser(new_user);
        setWaiting(false);
        // alert("done!");
    } catch (error) {
        alert("some error occured");
        console.error(error);
    }
    setWaiting(false);
}

async function GetHelper(
    setWaiting:(waiting:boolean)=>void,
    setUser:(user:IUser)=>void,
    post_request_path:string,
){
    setWaiting(true);
    try {
        await axios.get(URLBase + post_request_path,{
            withCredentials:true
        });
        const new_user:IUser = (await axios.get(URLBase + "/userDatabaseObject", {
            withCredentials:true
        })).data;
        setUser(new_user);
        setWaiting(false);
        // alert("done!");
    } catch (error) {
        alert("some error occured");
        console.error(error);
    }
    setWaiting(false);
}   


export {PostHelper, GetHelper}