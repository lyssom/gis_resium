import { createSlice } from '@reduxjs/toolkit'

const tabSlice = createSlice({
  name: 'ter',
  initialState: {
    isLoadter: false,
  },
  reducers: {
    loadTer: state => {
      state.isLoadter = !state.isLoadter
    }
}
})

export const { loadTer } = tabSlice.actions
export default tabSlice.reducer