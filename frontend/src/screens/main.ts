import * as React from "react"
import { Landing } from "./Landing"
import { Register } from "./Resgister"
import { Login } from "./Login"
import { ViewSchedules } from "./ViewSchedules"
import { Homescreen } from "./Homescreen"
import { DaysHoursScreen } from "./DaysHours"
import { CourseScreen, RoomScreen, ProfessorScreen, GroupScreen, PeriodsScreen } from "./Assets"
import { Schedule } from "./Schedule"
const SCREENS = [
    "Landing",
    "Homescreen",
    "Register",
    "Login",
    "View Schedules",
    "DaysHours",
    "Group",
    "Professor",
    "Room",
    "Course",
    "Period",
    "Schedule"
] as const 

type EScreen = typeof SCREENS[number]
const ScreenNameToComponentMapping = new Map<EScreen, React.FC<{}>>([
    ["Landing", Landing],
    ["Register", Register],
    ["Login", Login],
    ["View Schedules", ViewSchedules],
    ["Homescreen", Homescreen],
    ["DaysHours", DaysHoursScreen],
    ["Group", GroupScreen],
    ["Professor", ProfessorScreen],
    ["Room", RoomScreen],
    ["Course", CourseScreen],
    ["Period", PeriodsScreen],
    ["Schedule", Schedule]
]);

export type {EScreen}
export {ScreenNameToComponentMapping}