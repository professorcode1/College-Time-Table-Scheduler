import axios from "axios";
import * as React from "react";
import { URLBase } from "../utils/URLBase";
import { useAppDispatch, useAppSelector } from "../redux/main";
import { setUser } from "../redux/User";
import { setWaiting } from "../redux/waiting";
import HomescreeBGImage from "../assets/homepage.jpg"
import { Navbar } from "../components/Navbar";
import CourseImage from "../assets/homepage_anchor_course.jpg";
import GroupImage from "../assets/homepage_anchor_group.jpg";
import ProfessorImage from "../assets/homepage_anchor_prof.jpg";
import RoomImage from "../assets/homepage_anchor_room.jpg"
import { Link, useNavigate } from "react-router-dom";

const HowItWorks:React.FC<{}> = () => {
return (
    <>
    <p className="text-3xl pb-2">User Manual</p>
    To generate a college schedule the first thing we need to define is the number of hours the college is open 
                    and the number of days on which it is open. Once this has been defined we now have a concept of a period. 
                    A period is just the dicrete time-intervals during which a class takes place. So if thapar has 1 hour classes,
                    and during the hours of 9 AM to 6 PM all hours can have some class taking place then we have 9 periods per day.  
                    <br/><br/>
                    Once that has been defined we need to create all our <mark>resources</mark>. The three resources we have in a 
                    university are the <strong>professors</strong>, <strong>groups of students</strong> and <strong>rooms</strong>.<br/>
                    For all these resources we can define ban-time. Periods during which they are unavailable. Professors who have
                    a young ward waiting at home will have their ban times set to the later periods.<br/>
                    Periods during which a certain room may be undergoing renovations.<br/>
                    Hours during which the lunch break of certain groups is scheduled.
                    <br/><br/>
                    Once the list of all these resouces are available to the university the university can now define a course.
                    A course if taught by many professors, to many groups. Hence a course can be defines as a collection of
                    professors and groups. 
                    <br/><br/>
                    With the courses defines we can finally define a class. A class is one professor teaching 1 or more groups
                    in a room, for a certain number of periods. That class may need a set-time(the period during which the class
                    must start .i.e. a professor is only available for one specific period). Or it may have ban-times like resources 
                    (manufacturing labs cannot take place before lunch break as the students can pass out in the lab).<br/>
                    All in all : <strong> a period is a combination of one professor, a collection of groups, and a room which may 
                    additionally have a set-time / list of ban-times. </strong>
                    <br/><br/>
                    The navbar above helps you navigate to different pages where you can see the current entries and edit them.
                    In the homepage the links here are to create those different resouces.
                    <br/><br/>
                    Once you have create all the resouces, click on Generate Schedule at the top right to generate the schedule 
                    and let the algorithm take care of the rest. (for information on how it works head <a href="https://github.com/professorcode1/College-Time-Table-Scheduler" style={{
                        color:"#0000FF"
                    }}>here</a>.)
                    </>
)
}
const Homescreen:React.FC<{}> = () => {
    const dispatcher = useAppDispatch();
    const navigation = useNavigate();
    React.useEffect(()=>{
        (async ()=>{
            try {
                dispatcher(setWaiting(true))
                const user = (await axios.get(`${URLBase}/userDatabaseObject`, {
                    withCredentials:true
                })).data;
                console.log('user', user)
                dispatcher(setUser(
                    user
                ))
                dispatcher(setWaiting(false));
            } catch (error) {
                console.log(error)
                dispatcher(setWaiting(false));
                alert("some error occured in fetching your user data. Please reload page/try loging in again");
                navigation("/collegeSchduler/Login")
            }
        })()
    }, [])
    return (
        <>
        <Navbar />
        <div className="relative h-screen w-screen overflow-clip" >
            <img 
                className="absolute h-screen w-screen top-0 left-0"
                src={HomescreeBGImage} 
            />
            <div className="absolute h-screen w-screen top-0 left-0 flex flex-col">
                <div className="flex h-screen flex-col items-center justify-center w-screen mt-4  ">
                    <p className="text-4xl mt-4"> 
                        Homepage
                    </p>
                    <div className="w-screen h-[90%] flex">
                        <div className="h-full w-1/2 grid grid-cols-2">

                            <Link to="/collegeSchduler/Group">
                            <div className="p-1 bg-white rounded-md m-1 cursor-pointer">
                                <img className="" src={GroupImage} />
                                <p>Group</p>
                            </div>
                            </Link>
                            <Link to="/collegeSchduler/Professor">
                            <div className="p-1 bg-white rounded-md m-1 cursor-pointer">
                                <img className="" src={ProfessorImage} />
                                <p>Professor</p>
                            </div>
                            </Link>
                            <Link to="/collegeSchduler/Room">
                            <div className="p-1 bg-white rounded-md m-1 cursor-pointer">
                                <img className="" src={RoomImage} />
                                <p>Room</p>
                            </div>
                            </Link>
                            <Link to="/collegeSchduler/Course">
                            <div className="p-1 bg-white rounded-md m-1 cursor-pointer">
                                <img className="" src={CourseImage} />
                                <p>Course</p>
                            </div>
                            </Link>
                        </div>
                        <div className="h-full w-1/2 p-2">
                            <div className="bg-white opacity-70 h-full w-full p-1 pb-2 rounded-lg overflow-auto ">
                                <HowItWorks />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
        </>
    )
}

export {Homescreen}