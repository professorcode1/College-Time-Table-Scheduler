import axios from "axios"
import * as React from "react"
import { URLBase } from "../utils/URLBase"
import { useAppDispatch } from "../redux/main"
import { setWaiting } from "../redux/waiting"
import { scheduler } from "timers/promises"
import { setScreen } from "../redux/screen"
import { setScheduleId } from "../redux/SelectedSchedule"

const ViewSchedules:React.FC<{}> = ()=>{
    const dispatcher = useAppDispatch();
    const [schedule_data, setSchedule_data] = React.useState<Array<{
        email:string,
        instituteName:string,
        _id:number
    }>>([])
    React.useEffect(()=>{
        (async ()=>{
            try {
                dispatcher(setWaiting(true))
                setSchedule_data((await axios.get(URLBase + "/viewSchedules", {withCredentials:true})).data);
                dispatcher(setWaiting(false));
            } catch (error) {
                alert("some error occured")
            }
        })()
    }, [])
    return (
        <div className="h-screen w-screen flex flex-wrap justify-center ">
            {schedule_data.map(data => {
                return (
                    <div className="border border-black h-64 w-64 m-2 p-2 cursor-pointer" onClick={()=>{
                        dispatcher(setScreen("Schedule"));
                        dispatcher(setScheduleId(data._id));
                    }}>
                        <p className="text-2xl">Institute</p>
                        <p className="whitespace-nowrap h-8 overflow-hidden">{data.instituteName}</p>
                        <p className="text-2xl">Email</p>
                        <p className="whitespace-nowrap h-8 overflow-hidden text-eclipses">{data.email}</p>
                    </div>
                )
            })}
            
        </div>
    )
}

export {ViewSchedules}