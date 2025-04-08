import { useSelector } from 'react-redux'
import ToolBars from './ToolBars'
import CesiumViewer from './CesiumViewer'
import GISApp from './CodeEiditer'
import ViewerPage from './ViewerPage'
import './main.css'

import { ConfigProvider } from 'antd';

const Main = () => {
    const collapsed = useSelector(state => state.tab.isCollapse)
    const isLoadtile = useSelector(state => state.tiles.isLoadtile)
    const isgroundMeasure = useSelector(state => state.groundMeasure.isgroundMeasure)
    const isLoadter = useSelector(state => state.ter.isLoadter)
    const isLoadtif = useSelector(state => state.tif.isLoadtif)
    return (
      <ConfigProvider locale={{ Modal: { okText: '确认', cancelText: '取消' }, Popconfirm: { okText: '是', cancelText: '否' } }}>
      <ViewerPage/>
      </ConfigProvider>
    // <div className="container">
    //   <GISApp/>
    //   {/* <ToolBars collapsed={collapsed} isLoadtile={isLoadtile}/>
    //   <CesiumViewer 
    //   collapsed={collapsed} 
    //   isLoadtile={isLoadtile} 
    //   isgroundMeasure={isgroundMeasure}
    //   isLoadTer={isLoadter}
    //   isLoadTif={isLoadtif}
    //   /> */}
    // </div>
    )
}

export default Main