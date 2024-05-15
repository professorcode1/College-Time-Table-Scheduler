import * as React from "react";

interface IUnavailability{
    [key:string]:"on"|"off"
}

function getUnavailabilityKey(index:number):string{
    return `periodTaken${index}`
}

function getUnavailabilityIndex(day:number, period:number, periods_per_day:number){
    return day * periods_per_day + period;
}

const UnavailabilityCell: React.FC<{
    checked:boolean,
    changeCheck:()=>void
}> = ({
    checked,
    changeCheck

}) =>{
    return (
        <div onClick={changeCheck} className={" h-2 w-2 m-2 rounded-sm " + (checked ? " bg-red-600 " : " bg-green-600 ")} />
    )
}

const UnavailabilityRow:React.FC<{
    number_of_cols:number
    day_index:number,
    days_per_week:number,
    periods_per_day:number,
    unavailability:IUnavailability,
    setUnavailability:(a:IUnavailability)=>void
}> = ({
    number_of_cols,
    day_index,
    days_per_week,
    periods_per_day,
    unavailability,
    setUnavailability
}) =>{
    return (
        <div className="flex flex-row">
            {Array(number_of_cols).fill(null).map((u,i)=> {
                const key = getUnavailabilityKey(getUnavailabilityIndex(day_index, i, periods_per_day));
                const checked = unavailability[key] === "on";
                return <UnavailabilityCell 
                    checked={checked} 
                    changeCheck={()=>{
                        setUnavailability({...unavailability, [key]: (checked ? "off" : "on")})
                    }} 
                />
            })}
        </div>
    )
}

const UnavailabilityInner:React.FC<{
    days_per_week:number,
    periods_per_day:number,
    unavailability:IUnavailability,
    setUnavailability:(a:IUnavailability)=>void
}> = ({
    days_per_week,
    periods_per_day,
    unavailability,
    setUnavailability
}) => {
    return (
        <div className="flex">
            <div className="text-sm mt-6">
                {Array(days_per_week+1).fill(null).map((u,i) => <p>D{i}</p>)}
            </div>
            <div>
                <div className="flex text-sm">
                    {Array(periods_per_day).fill(null).map((u,i) => <p className={"h-2 w-2 m-2 " + (i === 0? "ml-1" : "")}>P{i}</p>)}
                </div>
                {Array(days_per_week).fill(null).map((u,i) => <UnavailabilityRow unavailability={unavailability} setUnavailability={setUnavailability} day_index={i} days_per_week={days_per_week} periods_per_day={periods_per_day} number_of_cols={periods_per_day} />)}
            </div>

        </div>
    )
}

const Unavailability:React.FC<{
    days_per_week:number,
    periods_per_day:number,
    unavailability:IUnavailability,
    setUnavailability:(a:IUnavailability)=>void
}> = ({
    days_per_week,
    periods_per_day,
    unavailability,
    setUnavailability
}) => {
    return (
        <div className="">
            <p className="text-2xl ml-6">Availability</p>
            <UnavailabilityInner setUnavailability={setUnavailability} days_per_week={days_per_week} periods_per_day={periods_per_day} unavailability={unavailability} />
        </div>
    )
}

export {Unavailability, getUnavailabilityKey}
export type {IUnavailability}