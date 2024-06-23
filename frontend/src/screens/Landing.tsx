import * as React from "react"
import { URLBase } from "../utils/URLBase"
import LoginImage from  "../assets/login_link_in_index.jpeg"
import RegisterImage from "../assets/register_link_in_index.jpeg"
import ViewScheduleImage from "../assets/viewSchedule_link_index.jpeg"
import { useAppDispatch, useAppSelector } from "../redux/main"
import { setScheduleId } from "../redux/SelectedSchedule"
import { IUser } from "../utils/UserType"
import axios from "axios"
import { setWaiting } from "../redux/waiting"
import { Link } from "react-router-dom"
const LandingCard:React.FC<{
    img:string,
    title:string,
    text:string,
    button_classes:string,
    link_to:string
}> = (
    {
        img,
        title,
        text,
        button_classes,
        link_to
    }
) => 
    {

    return (
        <div className="p-4 border border-slate-500 w-72" >
            <Link to={link_to}> 
            <img className="h-96 w-72 cursor-pointer"  src={img} alt="" />
            <p className="text-2xl text-bold mt-2">
                {title}
            </p>
            <p className="w-full h-16 mt-2">
                {text}
            </p>
            <button  className={`mt-6 border-2 w-36 rounded-lg p-2 ${button_classes}`}>
                {title}
            </button>
            </Link>
        </div>
    )
}

const Landing:React.FC<{}> = () =>{
    const dispatcher = useAppDispatch();
    
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
                    link_to="/collegeSchduler/Register"
                />
                <LandingCard 
                    img={LoginImage} 
                    title="Login"
                    text="Already have an account and need to make changes? Head here."
                    button_classes="border-green-400 text-green-800"
                    link_to="/collegeSchduler/Login"
                />
            </div>
        </div>
    )
}

export {Landing}