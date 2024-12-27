import { createSlice } from '@reduxjs/toolkit'

const tabSlice = createSlice({
  name: 'tif',
  initialState: {
    isLoadtif: false,
  },
  reducers: {
    loadTif: state => {
      state.isLoadtif = !state.isLoadtif
    }
}
})

export const { loadTif } = tabSlice.actions
export default tabSlice.reducer