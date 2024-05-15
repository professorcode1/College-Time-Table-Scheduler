import * as React from "react"
import { useAppSelector } from "../redux/main"
import axios from "axios";
import { URLBase } from "../utils/URLBase";

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
    const universityId = useAppSelector(s => s.scheduleId);
    const [schedule, setSchedule] = React.useState<{[key:string]:Array<Array<string>>}>({})
    React.useEffect(()=>{
        (async ()=>{
            try {
                setSchedule((await axios.get(URLBase + "/schedule/" + universityId)).data)
            } catch (error) {
                console.error(error);
                alert("sorry, some error occured")
            }
        })()
    }, [])
    return (
        <div className="p-2">
            {Object.entries(schedule).map(([title, table])=><SingleScheduleTable table={table} title={title} />)}
        </div>
    )
}

export {Schedule}