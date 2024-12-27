import { createSlice } from '@reduxjs/toolkit'

const tabSlice = createSlice({
  name: 'groundMeasure',
  initialState: {
    isgroundMeasure: false,
  },
  reducers: {
    groundMeasureState: state => {
      state.isgroundMeasure = !state.isgroundMeasure
    }
}
})

export const { groundMeasureState } = tabSlice.actions
export default tabSlice.reducer