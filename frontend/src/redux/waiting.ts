import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export const waitingSlice = createSlice({
  name: 'waiting',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState:false,
  reducers: {
    setWaiting: (state, action: PayloadAction<boolean>) => {
      return action.payload
    }
  }
})

export const { setWaiting } = waitingSlice.actions



export default waitingSlice.reducer