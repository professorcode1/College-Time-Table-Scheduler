import * as React from "react";
import { useAppSelector } from "../redux/main";
import { Navbar } from "./Navbar";
import { IUser } from "../utils/UserType";
import { CreateProfessor, SingleProfessor } from "./Professor";
import { CreateGroup, SingleGroup } from "./Groups";
import { CreateRoom, SingleRoom } from "./Room";
import { CreateCourse, SingleCourse } from "./Course";
import { CreatePeriod, SinglePeriod } from "./Periods";


const ResourceScreen:React.FC<{
    title_text:string,
    asset_name:"rooms"|"professors"|"groups"|"courses"|"periods"
}> = (
    {
        title_text,
        asset_name
    }
) => {
    const [showCreateProfessor, setShowCreateProfessor] = React.useState(false);
    const {numberOfDays :days_per_week, periodsPerDay :periods_per_day, professors ,groups, rooms, courses, periods} = useAppSelector(s => s.user!);
    const selected_course = useAppSelector( s => s.course)
    const CreateComponenet = (()=>{
        if(asset_name === "professors"){
            return CreateProfessor
        }else if(asset_name === "rooms"){
            return CreateRoom
        }
        else if(asset_name === "groups"){
            return CreateGroup
        }else if(asset_name === "courses"){
            return CreateCourse;
        }else{
            return CreatePeriod;
        }
    })();
    const SingleViewList = (()=>{
        if(asset_name === "professors"){
            return professors.map(prof => <SingleProfessor professor={prof} key={"prof" + prof._id} />);
        }else if(asset_name === "groups"){
            return groups.map(group => <SingleGroup group={group} key={"group" + group._id} />)
        }else if(asset_name === "rooms"){
            return rooms.map(room => <SingleRoom room={room} key={"room" + room._id} />);
        }else if(asset_name === "courses"){
            return courses.map(course => <SingleCourse course={course} key={"course" + course._id} />)
        }
        else{
            return periods.filter(period => period.parentCourse === selected_course.course_id).map(period => <SinglePeriod period={period} key={"period" + period._id} />)
        }
    })();
    return (
        <div className="overflow-x-clip">
            <Navbar />
            <div className="h-screen w-screen pt-10 flex items-center flex-col ">
                <p className="text-4xl">
                    {title_text}
                </p>
                {showCreateProfessor && <CreateComponenet dismount_me={() => setShowCreateProfessor(false)} days_per_week={days_per_week} periods_per_day={periods_per_day} />}
                <button 
                    className={"text-sm p-2 border  text-white rounded-lg m-1 " + (showCreateProfessor ? " bg-red-400 " : " bg-green-400 ")}
                    onClick={()=>setShowCreateProfessor(!showCreateProfessor)}
                >{showCreateProfessor ? "Never mind":("Create new "+title_text)}</button>
                <div className="w-full flex flex-wrap justify-center ">
                    {SingleViewList}
                </div>
            </div>
        </div>
    )
}

export {ResourceScreen}