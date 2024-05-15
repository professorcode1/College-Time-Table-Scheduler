import { IPeriod } from "../utils/UserType";
import { setWaiting } from "../redux/waiting";
import { setUser } from "../redux/User";
import { IUnavailability, Unavailability, getUnavailabilityKey } from "../components/Unavailability";
import { GetHelper, PostHelper } from "../utils/PostHelpter";
import { useAppDispatch, useAppSelector } from "../redux/main";
import * as React from "react";
import { CouseAssetPicker } from "./Course";
import Select from 'react-select';


const SinglePeriod:React.FC<{
    period:IPeriod, 
}> = ({period}) => {
    const dispatcher = useAppDispatch();
    const OnDelete = async () => {
        await GetHelper(
            x => dispatcher(setWaiting(x)),
            x => dispatcher(setUser(x)),
            "/deletePeriod/" + period._id
        );
    };
    const {groups, numberOfDays, periodsPerDay, courses, professors} = useAppSelector(s => s.user)!;
    const courseName = courses.find(x => x._id === period.parentCourse)!.courseName;
    const profName = professors.find(x => x._id === period.profTaking)!.professorName;
    const groups_attending = period.groupsAttending.map(x => groups.find(g => g._id === x)!).map(g => g.groupName)
    return (
        <div className="w-64 h-64 border border-black m-2 p-2 relative text-sm">
            <p className="text-lg">{period.periodName}</p>
            <p>Parent Course: {courseName}</p>
            <p>Taught By : {profName }</p>
            <p>Taught To: {groups_attending.join(", ")}</p>
            <p>Period Anti times:{JSON.stringify(period.periodAntiTime)}</p>
            <p>Period Set Time:{period.periodTime !== -1 ? period.periodTime : "Null"}</p>
            <p>Period Length:{period.periodLength}</p>
            <p>Period Frequency:{period.periodFrequency}</p>
            <a 
                className="absolute bottom-0 text-sm p-2 pl-1 text-blue-500 cursor-pointer"
                onClick={OnDelete}
            >Delete</a>
        </div>
    );
}

const CreatePeriod:React.FC<{
    days_per_week:number,
    periods_per_day:number,
    dismount_me:()=>void
}> = ({
    days_per_week,
    periods_per_day,
    dismount_me
}) => {
    const {groups:intialGroups, professors, rooms} = useAppSelector(s => s.user!);
    const courseSelected = useAppSelector(s => s.course);
    const [periodName, setperiodName] = React.useState("")
    const [unavailability, setUnavailability] = React.useState<IUnavailability>(Object.fromEntries(
        new Array(days_per_week * periods_per_day).fill(null).map((x,i) => [`periodTaken${i}`, "off"])
    ));
    const [specifyTime, setspecifyTime] = React.useState(false);
    const [periodLength, setperiodLength] = React.useState(1);
    const [periodFrequency, setperiodFrequency] = React.useState(1);
    const [timeSpeicifiedDay, settimeSpeicifiedDay] = React.useState(1);
    const [timeSpeicifiedPeriod, settimeSpeicifiedPeriod] = React.useState(1);
    const ProfIdToNameMapping:{[key:string]:string} = Object.fromEntries(professors.map(p => [p._id, p.professorName]));
    const RoomIdToNameMapping:{[key:string]:string} = Object.fromEntries(rooms.map(r => [r._id, r.roomName]))
    const [roomId, setroomId] = React.useState<IUnavailability>(Object.fromEntries(
        rooms.map((room,index) => [room._id, index === 0? "on" : "off"])
    ));
    const [profId, setprofId] = React.useState<IUnavailability>(Object.fromEntries(
        courseSelected.professor_ids.map((id, index)=>[id, index === 0? "on" : "off"])
    ));
    const dispatcher = useAppDispatch();
    const courseId = useAppSelector(s => s.course);
    const [groups, setGroups] = React.useState<IUnavailability>(Object.fromEntries(courseSelected.group_ids.map(group_id => [`${group_id}`, "off"])));
    const GroupIdToNameMapping:{[key:string]:string} = Object.fromEntries(intialGroups.map(group => [group._id, group.groupName]));
    const Submit= async () => {
        if(specifyTime){
            if(timeSpeicifiedDay < 1 || timeSpeicifiedDay > days_per_week){
                return alert(`Specify date is ${timeSpeicifiedDay} when it needs to be in [1, ${days_per_week}]`)
            }
            if(timeSpeicifiedPeriod < 1 || timeSpeicifiedPeriod > periods_per_day){
                return alert(`Specify period is ${timeSpeicifiedPeriod} when it needs to be in [1, ${periods_per_day}]`)
            }
        }
        if(periodLength < 1 || periodLength > periods_per_day){
            return alert(`Period lenght is ${periodLength} when it needs to be in [1, ${periods_per_day}]`)
        }
        if(Object.values(groups).filter(x => x=== "on").length ===0){
            return alert("You didn't select any groups!");
        }

        await PostHelper(
            x => dispatcher(setWaiting(x)),
            x => dispatcher(setUser(x)),
            "/period",
            {
                days_per_week,
                periods_per_day,
                periodName,
                courseId:courseId.course_id,
                periodLength,
                periodFrequency,
                specifyTime,
                profId:Object.entries(profId).find(([id,val])=>val === "on")![0],
                roomId:Object.entries(roomId).find(([id,val])=>val === "on")![0],
                timeSpeicifiedDay,
                timeSpeicifiedPeriod, 
                ...unavailability,
                ...groups,
                
            }
        );
        dismount_me();
    }



    return (
        <div className="w-1/2 border border-black rounded-lg p-2">
            <div className="flex m-4">
                <p className="mx-2 w-32">Period Name</p>
                <input type="text" className="border border-black rounded-lg" value={periodName} onChange={e => setperiodName(e.target.value)} />
            </div>
            <div className="flex m-4">
                <p className="mx-2 w-32">Period Length</p>
                <input type="text" className="border border-black rounded-lg" min={1} max={periods_per_day} value={periodLength} onChange={e => setperiodLength(Number(e.target.value))} />
            </div>
            <div className="flex m-4">
                <p className="mx-2 w-32">Period Frequency</p>
                <input type="text" className="border border-black rounded-lg" min="1"  value={periodFrequency} onChange={e => setperiodFrequency(Number(e.target.value))} />
            </div>
            <div className="flex m-4">
                <p className="mx-2 w-32">Professor</p>
                <div className="w-2/3">

                    <CouseAssetPicker slice_index={0} assetKeyStart="" asset={profId} asset_id_to_name_mapping={ProfIdToNameMapping} setAsset={setprofId} single_select={true} />
                </div>

            </div>
            <div className="flex m-4">
                <p className="mx-2 w-32">Room</p>
                <div className="w-2/3">

                    <CouseAssetPicker slice_index={0} assetKeyStart="" asset={roomId} asset_id_to_name_mapping={RoomIdToNameMapping} setAsset={setroomId} single_select={true} />
                </div>

            </div>
            <div className="flex m-4">
                <p className="mx-2 w-32">Specify time</p>
                <input type="checkbox" className="border border-black rounded-lg" checked={specifyTime} onClick={()=>setspecifyTime(!specifyTime)} />
            </div>
            
            { specifyTime || <div className="ml-6">
                <Unavailability setUnavailability={setUnavailability} unavailability={unavailability} days_per_week={days_per_week} periods_per_day={periods_per_day} />
            </div>}
            { specifyTime && <div className="ml-6">
                <div className="flex m-4">
                    <p className="mx-2 w-32">Specific Day</p>
                    <input type="number" className="border border-black rounded-lg" min="1" max={days_per_week} value={timeSpeicifiedDay} onChange={(e)=>settimeSpeicifiedDay(Number(e.target.value))} />
                </div>
                <div className="flex m-4">
                    <p className="mx-2 w-32">Specify Time</p>
                    <input type="number" className="border border-black rounded-lg" min="1" max={periods_per_day} value={timeSpeicifiedPeriod} onChange={(e)=>settimeSpeicifiedPeriod(Number(e.target.value))} />
                </div>
            </div>}
            <div className="ml-6">
                <p className="text-xl py-4 pt-1">Groups</p>
                <CouseAssetPicker slice_index={0} assetKeyStart="" asset={groups} asset_id_to_name_mapping={GroupIdToNameMapping} setAsset={setGroups} />
            </div>
            <button onClick={Submit} className="m-2 ml-6 p-2 text-md text-white bg-green-400 rounded-lg w-32">Submit</button>
        </div>
    )
}

export {CreatePeriod, SinglePeriod}