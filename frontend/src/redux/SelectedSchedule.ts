import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const scheduleSlice = createSlice({
  name: 'screen',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState:0,
  reducers: {
    setScheduleId: (state, action: PayloadAction<number>) => {
      return action.payload
    }
  }
})

export const { setScheduleId } = scheduleSlice.actions



export default scheduleSlice.reducer