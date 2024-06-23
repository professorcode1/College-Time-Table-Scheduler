import {  useAppSelector } from './redux/main';
import { Waiting } from './screens/Waiting';
import * as React from "react"
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import { Landing } from './screens/Landing';
import { Register } from './screens/Resgister';
import { Login } from './screens/Login';
import { Homescreen } from './screens/Homescreen';
import { DaysHoursScreen } from './screens/DaysHours';
import { CourseScreen, GroupScreen, PeriodsScreen, ProfessorScreen, RoomScreen } from './screens/Assets';
import { Schedule } from './screens/Schedule';

function App() {
  const waiting = useAppSelector(s => s.waiting);

  return (
    <>
    {waiting && <Waiting />}
    <Router>

    <Routes>

        <Route path="/collegeSchduler" element={<Landing />} />

        <Route path="/collegeSchduler/Register" element={<Register />} />
        <Route path="/collegeSchduler/Login" element={<Login />} />
        <Route path="/collegeSchduler/Homescreen" element={<Homescreen />} />
        <Route path="/collegeSchduler/DaysHours" element={<DaysHoursScreen />} />
        <Route path="/collegeSchduler/Group" element={<GroupScreen />} />
        <Route path="/collegeSchduler/Professor" element={<ProfessorScreen />} />
        <Route path="/collegeSchduler/Room" element={<RoomScreen />} />
        <Route path="/collegeSchduler/Course" element={<CourseScreen />} />
        <Route path="/collegeSchduler/Period" element={<PeriodsScreen />} />
        <Route path="/collegeSchduler/schedule/:universityId" element={<Schedule />} />

      </Routes>

    </Router>
    </>
);
}

export default App;