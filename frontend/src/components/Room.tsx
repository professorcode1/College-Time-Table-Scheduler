import { IGroup, IProfessor, IRoom, IUser } from "../utils/UserType";
import { setWaiting } from "../redux/waiting";
import { setUser } from "../redux/User";
import { IUnavailability, Unavailability, getUnavailabilityKey } from "../components/Unavailability";
import { GetHelper, PostHelper } from "../utils/PostHelpter";
import { useAppDispatch } from "../redux/main";
import * as React from "react";
const SingleRoom:React.FC<{
    room:IRoom, 
}> = (props) => {
    const dispatcher = useAppDispatch();
    const OnDelete = async () => {
        await GetHelper(
            x => dispatcher(setWaiting(x)),
            x => dispatcher(setUser(x)),
            "/deleteroom/" + props.room._id
        );
    }
    return (
        <div className="w-32 h-32 border border-black m-2 p-2 relative">
            <p className="absolute top-0 p-2 pl-1">
                {props.room.roomName}
            </p>
            <a 
                className="absolute bottom-0 text-sm p-2 pl-1 text-blue-500 cursor-pointer"
                onClick={OnDelete}
            >Delete</a>
        </div>
    );
}

const CreateRoom:React.FC<{
    days_per_week:number,
    periods_per_day:number,
    dismount_me:()=>void
}> = ({
    days_per_week,
    periods_per_day,
    dismount_me
}) => {
    const [roomName, setroomName] = React.useState("")
    const [roomCapacity, setroomCapacity] = React.useState(0)
    const [unavailability, setUnavailability] = React.useState<IUnavailability>(Object.fromEntries(
        new Array(days_per_week * periods_per_day).fill(null).map((x,i) => [getUnavailabilityKey(i), "off"])
    ));
    const dispatcher = useAppDispatch();
    const Submit= async () => {
        await PostHelper(
            x => dispatcher(setWaiting(x)),
            x => dispatcher(setUser(x)),
            "/room",
            {
                days_per_week,
                periods_per_day,
                roomName,
                roomCapacity,
                ...unavailability,
            }
        );
        dismount_me();
    }
    return (
        <div className="w-1/2 border border-black rounded-lg p-2">
            <div className="flex m-4">
                <p className="mx-2 w-32">Room Name</p>
                <input type="text" className="border border-black rounded-lg" value={roomName} onChange={e => setroomName(e.target.value)} />
            </div>
            <div className="flex m-4">
                <p className="mx-2 w-32">Room Quantity</p>
                <input type="number" className="border border-black rounded-lg" value={roomCapacity} onChange={e => setroomCapacity(Number(e.target.value))} />
            </div>
            <div className="ml-6">
                <Unavailability setUnavailability={setUnavailability} unavailability={unavailability} days_per_week={days_per_week} periods_per_day={periods_per_day} />
            </div>
            <button onClick={Submit} className="m-2 ml-6 p-2 text-md text-white bg-green-400 rounded-lg w-32">Submit</button>
        </div>
    )
}

export {CreateRoom, SingleRoom}