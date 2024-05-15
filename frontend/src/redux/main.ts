
import { useDispatch, useSelector } from 'react-redux'
import { configureStore } from '@reduxjs/toolkit'
import screenSlice from "./screen"
import waitingSlice from "./waiting"
import userSlice from "./User"
import courseSlice from "./SelectedCourse"
import scheduleSlice from './SelectedSchedule'
export const store = configureStore({
  reducer: {
    screen: screenSlice,
    waiting:waitingSlice,
    user:userSlice,
    course:courseSlice,
    scheduleId: scheduleSlice
  }
})

type RootState = ReturnType<typeof store.getState>
type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
