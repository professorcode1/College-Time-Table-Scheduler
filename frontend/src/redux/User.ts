import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { IUser } from '../utils/UserType'
export const userSlice = createSlice({
  name: 'user',
  // `createSlice` will infer the state type from the `initialState` argument
  initialState:null as (IUser|null),
  reducers: {
    setUser: (state, action: PayloadAction<IUser>) => {
      return action.payload
    }
  }
})

export const { 
  setUser
} = userSlice.actions



export default userSlice.reducer