import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { EScreen } from '../screens/main'

export const screenSlice = createSlice({
  name: 'screen',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState:"Landing" as EScreen,
  reducers: {
    setScreen: (state, action: PayloadAction<EScreen>) => {
      return action.payload
    }
  }
})

export const { setScreen } = screenSlice.actions



export default screenSlice.reducer