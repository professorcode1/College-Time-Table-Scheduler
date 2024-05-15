import { ResourceScreen } from "../components/ResourceScreen";

const CourseScreen:React.FC<{}> = () => {
    return <ResourceScreen title_text="Course" asset_name="courses" />
}
const GroupScreen:React.FC<{}> = () => {
    return <ResourceScreen title_text="Groups" asset_name="groups" />
}
const ProfessorScreen:React.FC<{}> = () => {
    return <ResourceScreen title_text="Professors" asset_name="professors" />
}

const RoomScreen: React.FC<{}> = () => {
    return <ResourceScreen title_text="Rooms" asset_name="rooms" />
}
const PeriodsScreen: React.FC<{}> = () => {
    return <ResourceScreen title_text="Periods" asset_name="periods" />
}
export {CourseScreen, GroupScreen, ProfessorScreen, RoomScreen, PeriodsScreen}