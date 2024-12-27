import { configureStore } from '@reduxjs/toolkit'
import TabReducer from './reducers/tab'
import TilesReducer from './reducers/tiles'
import groundMeasureState from './reducers/groundMeasure'
import ter from './reducers/ter'
import tif from './reducers/tif'

export default configureStore({
    reducer: {
        tab: TabReducer,
        tiles: TilesReducer,
        groundMeasure: groundMeasureState,
        ter: ter,
        tif: tif
    }
})