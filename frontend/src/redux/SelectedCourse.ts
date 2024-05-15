import { createSlice, PayloadAction } from '@reduxjs/toolkit'

type TCourseSlice = {course_id:number, professor_ids:number[], group_ids:number[]}

export const courseSlice = createSlice({
  name: 'screen',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState:{
    course_id:0,
    professor_ids:[],
    group_ids:[]
  } as TCourseSlice,
  reducers: {
    setCourse: (state, action: PayloadAction<TCourseSlice>) => {
      return action.payload
    }
  }
})

export const { setCourse } = courseSlice.actions



export default courseSlice.reducer