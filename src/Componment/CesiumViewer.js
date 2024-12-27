// import React, { useEffect, useRef } from "react";
// import {Ion, Viewer, createWorldTerrainAsync, SceneMode, ScreenSpaceEventType} from "cesium";
// // import "cesium/Build/Cesium/Widgets/widgets.css"; // Cesium 样式
// // import "cesium/Build/Cesium/Widgets/"
// // import "./MeasureTool.css"; // 自定义测量工具样式

// import MeasureTool from "./MeasureTool";

// // CesiumViewer 组件
// const CesiumViewer = () => {
//   const mapContainer = useRef(null); // 地图容器的引用

//   useEffect(() => {
//     // 配置 Cesium Ion 令牌
//     Ion.defaultAccessToken =
//       "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZjQ5ZGUzNC1jNWYwLTQ1ZTMtYmNjYS05YTY4ZTVmN2I2MDkiLCJpZCI6MTE3MTM4LCJpYXQiOjE2NzY0NDUyODB9.ZaNSBIfc1sGLhQd_xqhiSsc0yr8oS0wt1hAo9gbke6M";

//     // 创建 Cesium Viewer 实例
//     const viewer = new Viewer(mapContainer.current, {
//       terrainProvider: createWorldTerrainAsync({
//         requestWaterMask: true, // 请求水掩膜以实现水体效果
//         requestVertexNormals: true, // 请求法线以实现光照效果
//       }),
//       sceneMode: SceneMode.COLUMBUS_VIEW, // 可选视角模式
//     });

//     // // 开启帧率
//     // viewer.scene.debugShowFramesPerSecond = true;
//     // // 深度监测
//     // viewer.scene.globe.depthTestAgainstTerrain = true;

//     // // 关闭 Cesium 默认点击事件
//     // viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
//     //   ScreenSpaceEventType.LEFT_CLICK
//     // );
//     // viewer.cesiumWidget.screenSpaceEventHandler.removeInputAction(
//     //   ScreenSpaceEventType.LEFT_DOUBLE_CLICK
//     // );

//     // // 实例化测量工具
//     // const measureTool = new MeasureTool({
//     //   viewer: viewer,
//     //   terrainProvider: viewer.terrainProvider,
//     //   show: true, // 显示测量工具界面
//     // });

//     // // 清理函数
//     // return () => {
//     //   if (measureTool) measureTool._finishMeasure();
//     //   viewer.destroy();
//     // };
//   }, []);

//   return (
//     <div>
//       <div ref={mapContainer} style={{ width: "100%", height: "100vh" }} />
//     </div>
//   );
// };

// export default CesiumViewer;

import React, { useEffect, useRef } from 'react';
import { useState } from 'react';

import {createWorldTerrainAsync, Viewer, Ion} from 'cesium';

const CesiumViewer = () => {
  const cesiumContainerRef = useRef(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZjQ5ZGUzNC1jNWYwLTQ1ZTMtYmNjYS05YTY4ZTVmN2I2MDkiLCJpZCI6MTE3MTM4LCJpYXQiOjE2NzY0NDUyODB9.ZaNSBIfc1sGLhQd_xqhiSsc0yr8oS0wt1hAo9gbke6M";
    if (window.Cesium) {
      // 初始化 Cesium Viewer
      const cesiumViewer = new Viewer(cesiumContainerRef.current, {
        // imageryProvider: new window.Cesium.IonImageryProvider({ assetId: 2 }),
        baseLayerPicker: false,
        terrainProvider: createWorldTerrainAsync(),
      });

      setViewer(cesiumViewer);
    }

    return () => {
      if (viewer) {
        // 清理 Cesium 实例
        viewer.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={cesiumContainerRef}
      style={{
        width: '100%',
        height: '100vh', // 设置为全屏
      }}
    >
      {/* Cesium 会在此 div 中渲染 */}
    </div>
  );
};

export default CesiumViewer;
