import React, { useRef, useEffect, useState } from 'react';
import { Viewer, ImageryLayer, Entity, CameraFlyTo} from 'resium';  // 从 Resium 导入 Viewer 组件
import {ScreenSpaceEventHandler, defined, Color, 
  HeightReference, LabelStyle, Cartesian2, ArcType,VerticalOrigin,
  Cartographic,CallbackProperty, EllipsoidGeodesic, ScreenSpaceEventType,
  Cesium3DTileset, when, sampleTerrainMostDetailed, createWorldTerrainAsync,
  UrlTemplateImageryProvider, CesiumTerrainProvider,
  TerrainProvider, IonResource, Cartesian3, CreditDisplay
} from 'cesium'

import {get_space_distance} from '../../api/index.js'

const CesiumViewer = ({ collapsed, isLoadtile, isgroundMeasure, isLoadTer, isLoadTif}) => {
  // 创建 Viewer 组件的 ref
  const viewerRef = useRef(null);

  // 状态来控制光标样式
  const [cursor, setCursor] = useState("default");
  const [tile3D, settile3D] = useState("default"); 

  const [terrainProvider, setterrainProvider] = useState(null); 

  const [TerData, setTerData] = useState(null);

  // 当光标样式发生变化时，更新 Viewer 的光标样式
  useEffect(() => {
    if (viewerRef.current) {
      // 获取 Viewer 实例
      const viewer = viewerRef.current.cesiumElement;

      if (viewer) {
        // 修改 Viewer 的光标样式
        viewer._container.style.cursor = cursor;
      }
    }
  }, [cursor]);  // 当 cursor 状态发生变化时，更新光标样式

  const measureGroundDistance = () => {
    const viewer = viewerRef.current.cesiumElement;
    var terrainProvider = createWorldTerrainAsync({
      requestWaterMask: true, // 请求水掩膜以实现水体效果
      requestVertexNormals: true // 请求法线以实现光照效果
    });
    viewer.scene.globe.depthTestAgainstTerrain = true;

    const handler = new ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
    var positions = [];
    var poly = null;
    // var tooltip = document.getElementById("toolTip");
    var distance = 0;
    var cartesian = null;
    var floatingPoint;
    // tooltip.style.display = "block";

    handler.setInputAction(function (movement) {
        // tooltip.style.left = movement.endPosition.x + 3 + "px";
        // tooltip.style.top = movement.endPosition.y - 25 + "px";
        // tooltip.innerHTML = '<p>单击开始，右击结束</p>';
        cartesian = viewer.scene.pickPosition(movement.endPosition);
        console.log(cartesian);
        if (defined(cartesian)) {

          console.log(cartesian);
          let p = Cartographic.fromCartesian(cartesian);
          p.height = viewer.scene.sampleHeight(p);
          cartesian = viewer.scene.globe.ellipsoid.cartographicToCartesian(p);
          //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
          if (positions.length >= 2) {
              if (!defined(poly)) {
                  poly = new PolyLinePrimitive(positions);
              } else {
                  positions.pop();
                  // cartesian.y += (1 + Math.random());
                  positions.push(cartesian);
              }
              // console.log("distance: " + distance);
              // tooltip.innerHTML='<p>'+distance+'米</p>';
          }
        }
    }, ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function (movement) {
        // tooltip.style.display = "none";
        // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
        cartesian = viewer.scene.pickPosition(movement.position);
        if (defined(cartesian)) {
          let p = Cartographic.fromCartesian(cartesian);
          p.height = viewer.scene.sampleHeight(p);
          cartesian = viewer.scene.globe.ellipsoid.cartographicToCartesian(p);
          if (positions.length == 0) {
              positions.push(cartesian.clone());
          }
          positions.push(cartesian);
          console.log(positions)
          console.log(666888)
          getSpaceDistance(positions);
        }
    }, ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function (movement) {
        handler.destroy(); //关闭事件句柄
        positions.pop(); //最后一个点无效
        // viewer.entities.remove(floatingPoint);
        // tooltip.style.display = "none";
        viewer._container.style.cursor = "";
    }, ScreenSpaceEventType.RIGHT_CLICK);

    var PolyLinePrimitive = (function () {
        function _(positions) {
            this.options = {
                name: '直线',
                polyline: {
                    show: true,
                    positions: [],
                    material: Color.GOLD,
                    width: 2,
                    clampToGround: true
                }
            };
            this.positions = positions;
            this._init();
        }

        _.prototype._init = function () {
            var _self = this;
            var _update = function () {
                return _self.positions;
            };
            //实时更新polyline.positions
            this.options.polyline.positions = new CallbackProperty(_update, false);
            var et = viewer.entities.add(this.options);
        };

        return _;
    })();

    //空间两点距离计算函数
    function getSpaceDistance(positions) {
        var distance_ = 0;
        if (positions.length > 2) {
            var positions_ = [];
            var sp = Cartographic.fromCartesian(positions[positions.length - 3]);
            var ep = Cartographic.fromCartesian(positions[positions.length - 2]);
            var geodesic = new EllipsoidGeodesic();
            geodesic.setEndPoints(sp, ep);
            var s = geodesic.surfaceDistance;
            positions_.push(sp);
            var num = parseInt((s / 100).toFixed(0));
            num = num > 200 ? 200 : num;
            num = num < 20 ? 20 : num;
            for (var i = 1; i < num; i++) {
                var res = geodesic.interpolateUsingSurfaceDistance(s / num * i, new Cartographic());
                res.height = viewer.scene.sampleHeight(res);
                positions_.push(res);
            }
            positions_.push(ep);
            // var promise = sampleTerrainMostDetailed(terrainProvider, positions_);
            // when(promise, function (updatedPositions) {
            for (var ii = 0; ii < positions_.length - 1; ii++) {
                geodesic.setEndPoints(positions_[ii], positions_[ii + 1]);
                var d = geodesic.surfaceDistance;
                distance_ = Math.sqrt(Math.pow(d, 2) + Math.pow(positions_[ii + 1].height - positions_[ii]
                    .height,
                    2)) + distance_;
            }
            //在三维场景中添加Label
            var distance_add = parseFloat(distance_.toFixed(2));
            distance += distance_add;
            var textDisance = ((distance > 1000) ? (distance / 1000).toFixed(3) + '千米' : distance.toFixed(2) + '米') + "\n(+" + (distance_add > 1000 ? (distance_add / 1000).toFixed(3) + '千米' : distance_add + '米') + ")"

            // var textDisance = distance + "米";
            // if (distance > 1000) {
            //     textDisance = (distance / 1000).toFixed(3) + "千米";
            // }
            floatingPoint = viewer.entities.add({
                name: '空间直线距离',
                position: positions[positions.length - 1],
                point: {
                    pixelSize: 5,
                    color: Color.RED,
                    outlineColor: Color.WHITE,
                    outlineWidth: 2,
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY
                },
                label: {
                    text: textDisance,
                    font: '18px sans-serif',
                    fillColor: Color.GOLD,
                    style: LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: VerticalOrigin.BOTTOM,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    pixelOffset: new Cartesian2(20, -20),
                    // disableDepthTestDistance: Number.POSITIVE_INFINITY
                }
            });
        }
    }
    //空间两点距离计算函数
    function getSpaceDistance_(positions) {
        var distance_ = 0;
        if (positions.length > 2) {
            var positions_ = [];
            var sp = Cartographic.fromCartesian(positions[positions.length - 3]);
            var ep = Cartographic.fromCartesian(positions[positions.length - 2]);
            var geodesic = new EllipsoidGeodesic();
            geodesic.setEndPoints(sp, ep);
            var s = geodesic.surfaceDistance;
            positions_.push(sp);
            var num = parseInt((s / 100).toFixed(0));
            num = num > 200 ? 200 : num;
            num = num < 20 ? 20 : num;
            for (var i = 1; i < num; i++) {
                var res = geodesic.interpolateUsingSurfaceDistance(s / num * i, new Cartographic());
                positions_.push(res);
            }
            positions_.push(ep);
            var promise = sampleTerrainMostDetailed(terrainProvider, positions_);
            when(promise, function (updatedPositions) {
                for (var ii = 0; ii < positions_.length - 1; ii++) {
                    geodesic.setEndPoints(positions_[ii], positions_[ii + 1]);
                    var d = geodesic.surfaceDistance;
                    distance_ = Math.sqrt(Math.pow(d, 2) + Math.pow(positions_[ii + 1].height - positions_[ii]
                        .height,
                        2)) + distance_;
                }
                distance = parseFloat(distance_.toFixed(2));
                //在三维场景中添加Label
                var textDisance = distance + "米";
                if (distance > 1000) {
                    textDisance = (distance / 1000).toFixed(3) + "千米";
                }
                floatingPoint = viewer.entities.add({
                    name: '空间直线距离',
                    position: positions[positions.length - 1],
                    point: {
                        pixelSize: 5,
                        color: Color.RED,
                        outlineColor: Color.WHITE,
                        outlineWidth: 2,
                    },
                    label: {
                        text: textDisance,
                        font: '18px sans-serif',
                        fillColor: Color.GOLD,
                        style: LabelStyle.FILL_AND_OUTLINE,
                        outlineWidth: 2,
                        verticalOrigin: VerticalOrigin.BOTTOM,
                        pixelOffset: new Cartesian2(20, -20),
                    }
                });
            });
        }
    }
}


  const measureLineSpace  = () => {
    const viewer = viewerRef.current.cesiumElement;
    const handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    var positions = [];
    var poly = null;
    var distance = 0;
    var cartesian = null;
    var floatingPoint;
    var measureIds = []
    //监听移动事件
    handler.setInputAction(function (movement) {
        //移动结束位置
        cartesian = viewer.scene.pickPosition(movement.endPosition);
        if (!defined(cartesian)) {
            var ray = viewer.camera.getPickRay(movement.endPosition);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        //判断点是否在画布上
        if (defined(cartesian)) {
            if (positions.length >= 2) {
                if (!defined(poly)) {
                    //画线
                    poly = new PolyLinePrimitive(positions);
                } else {
                    positions.pop();
                    // cartesian.y += (1 + Math.random());
                    positions.push(cartesian);
                }
            }
        }

    }, ScreenSpaceEventType.MOUSE_MOVE);
    //监听单击事件
    handler.setInputAction(function (movement) {
        cartesian = viewer.scene.pickPosition(movement.position);
        if (!defined(cartesian)) {
            var ray = viewer.camera.getPickRay(movement.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }

        if (defined(cartesian)) {
            if (positions.length == 0) {
                positions.push(cartesian.clone());
            }
            positions.push(cartesian);
            let result
            let distance_add
            let textDisance
            getSpaceDistance(positions).then(data => {
              result = data; // 赋值给外部变量
              console.log(result); // 输出: "Hello, async!"
              var distance_add = parseFloat(result);
              distance += distance_add;

            textDisance = ((distance > 1000) ? (distance / 1000).toFixed(3) + '千米' : distance.toFixed(2) + '米') + "\n(+" + (distance_add > 1000 ? (distance_add / 1000).toFixed(3) + '千米' : distance_add + '米') + ")"

            floatingPoint = viewer.entities.add({
                name: '空间直线距离',
                position: positions[positions.length - 1],
                point: {
                    pixelSize: 5,
                    color: Color.RED,
                    outlineColor: Color.WHITE,
                    outlineWidth: 2,
                    heightReference: HeightReference.NONE
                },
                label: {
                    text: textDisance,
                    font: '18px sans-serif',
                    fillColor: Color.CHARTREUSE,
                    style: LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: VerticalOrigin.BOTTOM,
                    pixelOffset: new Cartesian2(20, -20),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    heightReference: HeightReference.NONE
                }
            });
            measureIds.push(floatingPoint.id);
          });

        }
    }, ScreenSpaceEventType.LEFT_CLICK);
    //监听双击事件
    handler.setInputAction(function (movement) {
         handler.destroy();
         positions.pop(); //最后一个点无效
        //  bMeasuring = false;
         viewer._container.style.cursor = "";
    }, ScreenSpaceEventType.RIGHT_CLICK);

    //绘线效果1
    var PolyLinePrimitive = (function () {
        function _(positions) {
            this.options = {
                name: '直线',
                polyline: {
                    show: true,
                    positions: [],
                    arcType: ArcType.NONE,
                    material: Color.CHARTREUSE,
                    width: 2
                }
            };
            this.positions = positions;
            this._init();
        }
        _.prototype._init = function () {
            var _self = this;
            var _update = function () {
                return _self.positions;
            };
            //实时更新polyline.positions
            this.options.polyline.positions = new CallbackProperty(_update, false);
            var et = viewer.entities.add(this.options);
            measureIds.push(et.id);
        };

        return _;
    })();

    //空间两点距离计算函数
    async function getSpaceDistance(positions) {

        // var distance_ = 0;
        // console.log(positions);
        // console.log(positions.length);
        // if (positions.length > 2) {
        //     var point1cartographic = Cartographic.fromCartesian(positions[positions.length - 3]);
        //     var point2cartographic = Cartographic.fromCartesian(positions[positions.length - 2]);
        //     /**根据经纬度计算出距离**/
        //     var geodesic = new EllipsoidGeodesic();
        //     geodesic.setEndPoints(point1cartographic, point2cartographic);
        //     var s = geodesic.surfaceDistance;
        //     //console.log(Math.sqrt(Math.pow(distance_, 2) + Math.pow(endheight, 2)));
        //     //返回两点之间的距离
        //     s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
        //     distance_ = distance_ + s;
        // }
        const res = await get_space_distance(positions)
        return res.data
    }
  }

  useEffect(() => {
    if (collapsed) {
      startMeasuring();  // 当状态变为 true 时调用 startMeasuring
    }
  }, [collapsed]);  // 监听 isMeasuring 的变化

  const startMeasuring = () => {
    measureLineSpace();
    setCursor("crosshair");
  };

  useEffect(() => {
    if (isgroundMeasure) {
      startGroundMeasuring();  // 当状态变为 true 时调用 startMeasuring
    }
  }, [isgroundMeasure]);  // 监听 isMeasuring 的变化

  const startGroundMeasuring = () => {
    measureGroundDistance();
    setCursor("crosshair");
  };

  useEffect(() => {
      if (viewerRef.current) {
        const viewer = viewerRef.current.cesiumElement;
  
        if (viewer) {
          viewer.scene.debugShowFramesPerSecond = true;
          viewer.scene.globe.depthTestAgainstTerrain = true;

          async function loadTileset() {
            try {
              console.log("1111yyyy")
                const tileset = await Cesium3DTileset.fromUrl(
                    "http://127.0.0.1:8000/tileset.json"
                );
                console.log("Tileset loaded:", tileset);
                viewer.scene.primitives.add(tileset);
                viewer.zoomTo(tileset)


            } catch (error) {
                console.error("Failed to load tileset:", error);
            }
          }
          loadTileset()

          // var handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
          // handler.setInputAction(function (movement) {
  
          //     var pickedFeature = viewer.scene.pick(movement.position);
          //     if (defined(pickedFeature)) {
          //         console.log(pickedFeature);
          //         console.log(pickedFeature.getProperty("name"));
          //     }
  
          // }, ScreenSpaceEventType.LEFT_CLICK);
        }
      }
    }, [tile3D]);  // 当 cursor 状态发生变化时，更新光标样式

  useEffect(() => {
    if (isLoadtile) {
      startLoadTiles();  // 当状态变为 true 时调用 startMeasuring
    }
  }, [isLoadtile]);  // 监听 isMeasuring 的变化

  const startLoadTiles = () => {
    console.log("触发空间距离测量功能");
    settile3D("crosshair");
  };

  useEffect(() => {
    if  (isLoadTer) {
      const imp = new UrlTemplateImageryProvider({
        url: 'http://localhost:8000/pm25/{z}/{x}/{y}.png',
        maximumLevel: 7,
      })
      setTerData(imp)
    }
  }, [isLoadTer])

  useEffect(() => {
    if  (isLoadTif) {
        const terrainProvider = CesiumTerrainProvider.fromUrl(
          'http://localhost:8000/tiles'
        )
        setterrainProvider(terrainProvider)
        // CameraFlyTo(Cartesian3.fromDegrees(114.30, 30.59, 100))
        // startLoadTiles(); 
      }
  }, [isLoadTif])

  const position = Cartesian3.fromDegrees(114.30, 30.59, 100);
  const pointGraphics = { pixelSize: 10 };

  // const [hideCredits, setHideCredits] = useState(true);

  const style = document.createElement('style');
  style.innerHTML = `
    .cesium-credit-wrapper {
      display: none !important;
    }
    .cesium-credit-expand-link{
      display: none !important;
      }
  `;
  document.head.appendChild(style);


  return (
    <div>
      {terrainProvider === null ? (
        TerData === null ?(
          <Viewer
          full
          ref={viewerRef}
          timeline={false}
          homeButton={false}
          animation={false}
          geocoder={false}
          fullscreenButton={false}
          navigationHelpButton={false}
          baseLayerPicker={false}
        >
          <Entity
            position={Cartesian3.fromDegrees(114.305393, 30.5931, 100)}
            name="武汉"
            point={{ pixelSize: 10 }}
          />
        </Viewer>
        ) :(
          <Viewer
          full
          timeline={false}
          homeButton={false}
          animation={false}
          geocoder={false}
          fullscreenButton={false}
          navigationHelpButton={false}
          baseLayerPicker={false}
          // terrainProvider={terrainProvider} // 当 terrainProvider 改变时自动更新
        >
          <Entity
            position={Cartesian3.fromDegrees(114.305393, 30.5931, 100)}
            name="武汉"
            point={{ pixelSize: 10 }}
          />
          <ImageryLayer imageryProvider={TerData} />
        </Viewer>
        )

        
      ) : (
        <Viewer
          full
          ref={viewerRef}
          timeline={false}
          homeButton={false}
          animation={false}
          geocoder={false}
          fullscreenButton={false}
          navigationHelpButton={false}
          baseLayerPicker={false}
          terrainProvider={terrainProvider}
        >
          <Entity
            position={Cartesian3.fromDegrees(114.305393, 30.5931, 100)}
            name="武汉"
            point={{ pixelSize: 10, color: Color.RED }}
          />
        </Viewer>
      )}
    </div>
  );

};

export default CesiumViewer;

