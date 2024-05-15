interface IPeriodAsset {
    unAvialability:number[],
    _id:number

}
interface IRoom extends IPeriodAsset {
    roomName:string,
    roomCapacity:number,
    periodsUsedIn:string[]
}
interface IProfessor extends IPeriodAsset {
    professorName:string,
    periodsTaken:string[]
}
interface IGroup extends IPeriodAsset {
    groupName:string
    groupQuantity:number
    periodsAttended:string[]
}
interface ICourse{
    _id:number
    courseName:string
}
interface IPeriod{
    _id:string
    periodName: string,
    parentCourse: number,
    profTaking: number,
    roomUsed: number,
    periodLength: number,
    periodFrequency: number,
    periodTime: number,
    groupsAttending: number[],
    periodAntiTime: number[]
}
interface IUser{
    _id:number
    periodsPerDay:number,
    numberOfDays:number,
    rooms:IRoom[]
    professors:IProfessor[]
    groups:IGroup[]
    courses:ICourse[]
    periods:IPeriod[]
}

export type {IUser, IRoom,IProfessor,IGroup,ICourse,IPeriod}