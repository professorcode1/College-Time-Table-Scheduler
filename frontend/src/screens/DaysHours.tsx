import * as React from "react";
import { Navbar } from "../components/Navbar";
import { useAppDispatch, useAppSelector } from "../redux/main";
import { setUser } from "../redux/User";
import { setWaiting } from "../redux/waiting";
import { PostHelper } from "../utils/PostHelpter";
import { useNavigate } from "react-router-dom";

const DaysHoursScreen:React.FC<{}> = () =>{
    const user = useAppSelector(s => s.user);
    const [parameters, setParameters] = React.useState({
        days_per_week:user?.numberOfDays,
        periods_per_day:user?.periodsPerDay
    });
    const navigation = useNavigate();

    const dispatcher = useAppDispatch();
    React.useEffect(()=>{
        if(user === null){
            navigation("/collegeSchduler/Login");
            alert("some error occured. Please log in again")
        }
    }, [user]);
    if(user === null){
        return null;
    }
    const OnSubmit = async () => {
        PostHelper(
            x => dispatcher(setWaiting(x)),
            x => dispatcher(setUser(x)),
            "/parameter",
            parameters
        );
    };
    return (
        <>
            <Navbar />
            <div className="h-screen w-screen flex items-center justify-center">
                <div className="h-96 w-96 border border-black rounded-lg p-4 flex flex-col items-begin justify-between">
                    <p className="text-3xl">Set the Days/Hours </p>
                    <div>
                        <p>Days per week</p>
                        <input 
                            className="border border-black rounded-md px-2 my-1"
                            type="number" 
                            value={parameters.days_per_week} 
                            onChange={(e)=>{setParameters({...parameters,days_per_week:Number(e.target.value)})}} 
                        />
                    </div>
                    <div>
                        <p>Periods per day</p>
                        <input 
                            className="border border-black rounded-md px-2 my-1 "
                            type="number" 
                            value={parameters.periods_per_day} 
                            onChange={(e)=>{setParameters({...parameters,periods_per_day:Number(e.target.value)})}} 
                        />
                    </div>
                    <button 
                        className="w-32 bg-green-400 rounded-lg text-white"
                        onClick={OnSubmit}
                    >Submit</button>
                </div>
            </div>
        </>
    )
}

export {DaysHoursScreen}