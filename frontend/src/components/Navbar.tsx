import * as React from "react";
import { useAppDispatch, useAppSelector } from "../redux/main";
import { Link } from "react-router-dom";

const Navbar:React.FC<{}> = () => {
    const dispatcher = useAppDispatch();
    const user = useAppSelector(s => s.user);
    if(user === null){
        return null;
    }
    const number_of_periods = user.periods.length;
    return (
        <div style={{
            zIndex:10000
        }}
        className="flex items-center justify-between fixed top-0 left-0 bg-black text-white py-2  w-screen"
        >
            <div className="flex items-around">
                <Link 
                    className="px-2 cursor-pointer"
                    to="/collegeSchduler/Homescreen"
                >Homepage</Link>
                <Link 
                    className="px-2 cursor-pointer"
                    to="/collegeSchduler/DaysHours"
                >Days/Hours</Link>
                <Link 
                    className="px-2 cursor-pointer"
                    to="/collegeSchduler/Professor"
                >Professor</Link>
                <Link 
                    className="px-2 cursor-pointer"
                    to="/collegeSchduler/Group"
                >Group</Link>
                <Link 
                    className="px-2 cursor-pointer"
                    to="/collegeSchduler/Room"
                >Room</Link>
                <Link 
                    className="px-2 cursor-pointer"
                    to="/collegeSchduler/Course"
                >Course</Link>
            </div>
            <div>
                { user.schedule_exists && <Link 
                    className="px-2 cursor-pointer"
                    to={`/collegeSchduler/Schedule/${user._id}`}
                >View Schedule
                </Link>}
                <a
                    className="px-2 cursor-pointer"
                    onClick={()=>{
                        if(number_of_periods === 0){
                            return alert("please make some periods first")
                        }
                        window.location.href = window.location.origin + "/collegeSchduler/generateSchedule"
                    }}
                >
                    Genereate Schedule
                </a>
            </div>
        </div>
    )
}

export {Navbar}