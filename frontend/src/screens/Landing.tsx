import * as React from "react"
import { URLBase } from "../utils/URLBase"
import LoginImage from  "../assets/login_link_in_index.jpeg"
import RegisterImage from "../assets/register_link_in_index.jpeg"
import ViewScheduleImage from "../assets/viewSchedule_link_index.jpeg"
import { useAppDispatch, useAppSelector } from "../redux/main"
import { setScreen } from "../redux/screen"
import { setScheduleId } from "../redux/SelectedSchedule"
import { IUser } from "../utils/UserType"
import axios from "axios"
import { setWaiting } from "../redux/waiting"
const LandingCard:React.FC<{
    img:string,
    title:string,
    text:string,
    button_classes:string,
    onClick:()=>void
}> = (
    {
        img,
        title,
        text,
        button_classes,
        onClick
    }
) => 
    {

    return (
        <div className="p-4 border border-slate-500 w-72" >
            <img className="h-96 w-72 cursor-pointer" onClick={onClick} src={img} alt="" />
            <p className="text-2xl text-bold mt-2">
                {title}
            </p>
            <p className="w-full h-16 mt-2">
                {text}
            </p>
            <button onClick={onClick} className={`mt-6 border-2 w-36 rounded-lg p-2 ${button_classes}`}>
                {title}
            </button>
        </div>
    )
}

const Landing:React.FC<{}> = () =>{
    const dispatcher = useAppDispatch();
    const view_schedules = new URLSearchParams(window.location.search).get("view_schedules");
    if( view_schedules === "true"){
        window.history.pushState({}, document.title, "/collegeSchduler" );
        (async ()=>{
            try {
                dispatcher(setWaiting(true));
                const new_user:IUser = (await axios.get(URLBase + "/userDatabaseObject", {
                    withCredentials:true
                })).data;                
                dispatcher(setWaiting(false));
                dispatcher(setScreen("Schedule"));
                dispatcher(setScheduleId(new_user._id));
            } catch (error) {
                dispatcher(setScreen("View Schedules"));
                dispatcher(setWaiting(false));
            }

            
        })()
    }
    return (
        <div className="w-screen h-screen flex flex-col overflow-x-hidden">
            <div className="flex flex-col items-center justify-center mt-4 border-slate-800 border-b-2 pb-4 mx-2">
                <p className="text-5xl">
                    College Scheduler
                </p>
                <p className="mt-2">
                    A Software Engineering project by <a
                     className="text-blue"
                     href={URLBase}
                     style={{
                        color:"#0000EE"
                     }}
                    >Raghav Kumar</a>
                </p>
            </div>
            <div className="h-full flex items-center justify-around my-4">
                <LandingCard 
                    img={RegisterImage} 
                    title="Register"
                    text="If you are a administrator of your institute and need to create a schedule then create an account." 
                    button_classes="border-blue-400 text-blue-800"
                    onClick={()=>dispatcher(setScreen("Register"))}
                />
                <LandingCard 
                    img={LoginImage} 
                    title="Login"
                    text="Already have an account and need to make changes? Head here."
                    button_classes="border-green-400 text-green-800"
                    onClick={()=>dispatcher(setScreen("Login"))}
                />
                <LandingCard 
                    img={ViewScheduleImage} 
                    title="View Schedules"
                    text="Check out the list of all Institutes that use our service and locate your institute then view its schedule."
                    button_classes="border-slate-800"
                    onClick={()=>dispatcher(setScreen("View Schedules"))}
                />
            </div>
        </div>
    )
}

export {Landing}