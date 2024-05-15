import * as React from "react";
import { useAppDispatch, useAppSelector } from "../redux/main";
import { setScreen } from "../redux/screen";

const Navbar:React.FC<{}> = () => {
    const dispatcher = useAppDispatch();
    const number_of_periods = useAppSelector(s => s.user?.periods.length)
    return (
        <div style={{
            zIndex:10000
        }}
        className="flex items-center justify-between fixed top-0 left-0 bg-black text-white py-2  w-screen"
        >
            <div className="flex items-around">
                <p 
                    className="px-2 cursor-pointer"
                    onClick={()=>dispatcher(setScreen("Homescreen"))}
                >Homepage</p>
                <p 
                    className="px-2 cursor-pointer"
                    onClick={()=>dispatcher(setScreen("DaysHours"))}
                >Days/Hours</p>
                <p 
                    className="px-2 cursor-pointer"
                    onClick={()=>dispatcher(setScreen("Professor"))}
                >Professor</p>
                <p 
                    className="px-2 cursor-pointer"
                    onClick={()=>dispatcher(setScreen("Group"))}
                >Group</p>
                <p 
                    className="px-2 cursor-pointer"
                    onClick={()=>dispatcher(setScreen("Room"))}
                >Room</p>
                <p 
                    className="px-2 cursor-pointer"
                    onClick={()=>dispatcher(setScreen("Course"))}
                >Course</p>
            </div>
            <div>
                <p
                    className="px-2 cursor-pointer"
                    onClick={()=>{
                        if(number_of_periods === 0){
                            return alert("please make some periods first")
                        }
                        window.location.href = window.location.origin + "/collegeSchduler/generateSchedule"
                    }}
                >
                    Genereate Schedule
                </p>
            </div>
        </div>
    )
}

export {Navbar}