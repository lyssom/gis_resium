import { createSlice } from '@reduxjs/toolkit'

const tabSlice = createSlice({
  name: 'tiles',
  initialState: {
    isLoadtile: false,
  },
  reducers: {
    loadTiles: state => {
      state.isLoadtile = !state.isLoadtile
    }
}
})

export const { loadTiles } = tabSlice.actions
export default tabSlice.reducer