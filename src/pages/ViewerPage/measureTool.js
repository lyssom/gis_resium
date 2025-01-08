import * as Cesium from "cesium";

const measureLineSpace  = (viewer) => {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
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
        if (!Cesium.defined(cartesian)) {
            var ray = viewer.camera.getPickRay(movement.endPosition);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        //判断点是否在画布上
        if (Cesium.defined(cartesian)) {
            if (positions.length >= 2) {
                if (!Cesium.defined(poly)) {
                    //画线
                    poly = new PolyLinePrimitive(positions);
                } else {
                    positions.pop();
                    // cartesian.y += (1 + Math.random());
                    positions.push(cartesian);
                }
            }
        }

    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
    //监听单击事件
    handler.setInputAction(function (movement) {
        cartesian = viewer.scene.pickPosition(movement.position);
        if (!Cesium.defined(cartesian)) {
            var ray = viewer.camera.getPickRay(movement.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }

        if (Cesium.defined(cartesian)) {
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
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.NONE
                },
                label: {
                    text: textDisance,
                    font: '18px sans-serif',
                    fillColor: Cesium.Color.CHARTREUSE,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 2,
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                    pixelOffset: new Cesium.Cartesian2(20, -20),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    heightReference:Cesium.HeightReference.NONE
                }
            });
            measureIds.push(floatingPoint.id);
          });

        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //监听双击事件
    handler.setInputAction(function (movement) {
         handler.destroy();
         positions.pop(); //最后一个点无效
        //  bMeasuring = false;
         viewer._container.style.cursor = "";
    },Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    //绘线效果1
    var PolyLinePrimitive = (function () {
        function _(positions) {
            this.options = {
                name: '直线',
                polyline: {
                    show: true,
                    positions: [],
                    arcType: Cesium.ArcType.NONE,
                    material: Cesium.Color.CHARTREUSE,
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
            this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
            var et = viewer.entities.add(this.options);
            measureIds.push(et.id);
        };

        return _;
    })();

    //空间两点距离计算函数
    async function getSpaceDistance(positions) {

        var distance_ = 0;
        console.log(positions);
        console.log(positions.length);
        if (positions.length > 2) {
            var point1cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 3]);
            var point2cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 2]);
            /**根据经纬度计算出距离**/
            var geodesic = new Cesium.EllipsoidGeodesic();
            geodesic.setEndPoints(point1cartographic, point2cartographic);
            var s = geodesic.surfaceDistance;
            //console.log(Math.sqrt(Math.pow(distance_, 2) + Math.pow(endheight, 2)));
            //返回两点之间的距离
            s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
            distance_ = distance_ + s;
        }
        // const res = await get_space_distance(positions)
        // return res.data
        return distance_;
    }
  }

   const measureGroundDistance = (viewer) => {
      viewer.scene.globe.depthTestAgainstTerrain = true;
  
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
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
          if (Cesium.defined(cartesian)) {
  
            console.log(cartesian);
            let p = Cesium.Cartographic.fromCartesian(cartesian);
            p.height = viewer.scene.sampleHeight(p);
            cartesian = viewer.scene.globe.ellipsoid.cartographicToCartesian(p);
            //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
            if (positions.length >= 2) {
                if (!Cesium.defined(poly)) {
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
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
  
      handler.setInputAction(function (movement) {
          // tooltip.style.display = "none";
          // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
          cartesian = viewer.scene.pickPosition(movement.position);
          if (Cesium.defined(cartesian)) {
            let p = Cesium.Cartographic.fromCartesian(cartesian);
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
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
      handler.setInputAction(function (movement) {
          handler.destroy(); //关闭事件句柄
          positions.pop(); //最后一个点无效
          // viewer.entities.remove(floatingPoint);
          // tooltip.style.display = "none";
          viewer._container.style.cursor = "";
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
  
      var PolyLinePrimitive = (function () {
          function _(positions) {
              this.options = {
                  name: '直线',
                  polyline: {
                      show: true,
                      positions: [],
                      material: Cesium.Color.GOLD,
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
              this.options.polyline.positions = new Cesium.CallbackProperty(_update, false);
              var et = viewer.entities.add(this.options);
          };
  
          return _;
      })();
  
      //空间两点距离计算函数
      function getSpaceDistance(positions) {
          var distance_ = 0;
          if (positions.length > 2) {
              var positions_ = [];
              var sp = Cesium.Cartographic.fromCartesian(positions[positions.length - 3]);
              var ep = Cesium.Cartographic.fromCartesian(positions[positions.length - 2]);
              var geodesic = new Cesium.EllipsoidGeodesic();
              geodesic.setEndPoints(sp, ep);
              var s = geodesic.surfaceDistance;
              positions_.push(sp);
              var num = parseInt((s / 100).toFixed(0));
              num = num > 200 ? 200 : num;
              num = num < 20 ? 20 : num;
              for (var i = 1; i < num; i++) {
                  var res = geodesic.interpolateUsingSurfaceDistance(s / num * i, new Cesium.Cartographic());
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
                      color: Cesium.Color.RED,
                      outlineColor: Cesium.Color.WHITE,
                      outlineWidth: 2,
                      // disableDepthTestDistance: Number.POSITIVE_INFINITY
                  },
                  label: {
                      text: textDisance,
                      font: '18px sans-serif',
                      fillColor: Cesium.Color.GOLD,
                      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                      outlineWidth: 2,
                      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                      disableDepthTestDistance: Number.POSITIVE_INFINITY,
                      pixelOffset: new Cesium.Cartesian2(20, -20),
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
              var sp = Cesium.Cartographic.fromCartesian(positions[positions.length - 3]);
              var ep = Cesium.Cartographic.fromCartesian(positions[positions.length - 2]);
              var geodesic = new Cesium.EllipsoidGeodesic();
              geodesic.setEndPoints(sp, ep);
              var s = geodesic.surfaceDistance;
              positions_.push(sp);
              var num = parseInt((s / 100).toFixed(0));
              num = num > 200 ? 200 : num;
              num = num < 20 ? 20 : num;
              for (var i = 1; i < num; i++) {
                  var res = geodesic.interpolateUsingSurfaceDistance(s / num * i, new Cesium.Cartographic());
                  positions_.push(res);
              }
              positions_.push(ep);
              var promise = Cesium.sampleTerrainMostDetailed(viewer.terrainProvider, positions_);
              Cesium.when(promise, function (updatedPositions) {
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
                          color: Cesium.Color.RED,
                          outlineColor: Cesium.Color.WHITE,
                          outlineWidth: 2,
                      },
                      label: {
                          text: textDisance,
                          font: '18px sans-serif',
                          fillColor: Cesium.Color.GOLD,
                          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                          outlineWidth: 2,
                          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                          pixelOffset: new Cesium.Cartesian2(20, -20),
                      }
                  });
              });
          }
      }
  }



  export {measureLineSpace, measureGroundDistance};