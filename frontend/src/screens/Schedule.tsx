import * as React from "react"
import { useAppDispatch, useAppSelector } from "../redux/main"
import axios from "axios";
import { URLBase } from "../utils/URLBase";
import { useParams } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { setUser } from "../redux/User";

const SingleScheduleTable:React.FC<{
    title:string, 
    table:Array<Array<string>>
}> = ({
    title,
    table
}) => {
    return (
        <div className="mt-8">
            <p className="text-3xl mb-4">{title}</p>
            <table className="w-full border border-black table-fixed">
                <tr>
                    {new Array(table[0].length).fill(null).map((n,i)=><th>Period {i+1}</th>)}
                </tr>
                {table.map(row => {
                    return <tr className="text-center">
                        {row.map(cell => <td>{cell}</td>)}
                    </tr>
                })}
            </table>
        </div>
    )
}

const Schedule:React.FC<{}> = () => {
    const {universityId} = useParams();
    console.log(universityId)
    const [schedule, setSchedule] = React.useState<{[key:string]:Array<Array<string>>}>({})
    const dispatcher = useAppDispatch();
    React.useEffect(()=>{
        (async ()=>{
            try {
                setSchedule((await axios.put(URLBase + "/schedule/" + universityId)).data);

                const user = (await axios.get(`${URLBase}/userDatabaseObject`, {
                    withCredentials:true
                })).data;
                console.log('user', user)
                dispatcher(setUser(
                    user
                ))
            } catch (error) {
                console.error(error);
                alert("sorry, some error occured")
            }
        })()
    }, [])
    return (
        <>
        <Navbar />
        <div className="p-2">
            {Object.entries(schedule).map(([title, table])=><SingleScheduleTable table={table} title={title} />)}
        </div>
        </>
    )
}

export {Schedule}