import * as Cesium from "cesium";

const measureLineSpace  = (viewer, handleAddGeoJsonData) => {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    var positions = [];
    var poly = null;
    var distance = 0;
    var cartesian = null;
    var floatingPoint;
    var measureIds = []

    var geoJsonData = {
        type: "FeatureCollection",
        features: []
    };

    var temp_points = [];
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

            const cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
            geoJsonData.features.push({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [
                        Cesium.Math.toDegrees(cartographic.longitude),
                        Cesium.Math.toDegrees(cartographic.latitude)]
                },
                properties: {
                    distance: distance.toFixed(2),
                    text: textDisance
                }
            });
            temp_points.push([
                Cesium.Math.toDegrees(cartographic.longitude),
                Cesium.Math.toDegrees(cartographic.latitude)
            ])

            if (temp_points.length >= 2) {
                geoJsonData.features.push({
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [temp_points[temp_points.length-2],temp_points[temp_points.length-1]]
                    },
                    properties: {
                        totalDistance: distance.toFixed(2)
                    }
                });
            }
          });
        //   console.log(geoJsonData)
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    //监听双击事件
    handler.setInputAction(function (movement) {
         handler.destroy();
         positions.pop(); //最后一个点无效
        //  bMeasuring = false;
        viewer._container.style.cursor = "";
        handleAddGeoJsonData({"id": Cesium.createGuid(), "data": geoJsonData, "type": "空间距离"})
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

   const measureGroundDistance = (viewer, handleAddGeoJsonData) => {
      viewer.scene.globe.depthTestAgainstTerrain = true;
  
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
      var positions = [];
      var poly = null;
      // var tooltip = document.getElementById("toolTip");
      var distance = 0;
      var cartesian = null;
      var floatingPoint;
      // tooltip.style.display = "block";

      var geoJsonData = {
        type: "FeatureCollection",
        features: []
    };

    var temp_points = [];
  
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
            getSpaceDistance(positions);
          }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  
      handler.setInputAction(function (movement) {
          handler.destroy(); //关闭事件句柄
          positions.pop(); //最后一个点无效
          // viewer.entities.remove(floatingPoint);
          // tooltip.style.display = "none";
          viewer._container.style.cursor = "";
          handleAddGeoJsonData({"id": Cesium.createGuid(), "data": geoJsonData, "type": "地表距离"})
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

              const cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
              geoJsonData.features.push({
                  type: "Feature",
                  geometry: {
                      type: "Point",
                      coordinates: [
                          Cesium.Math.toDegrees(cartographic.longitude),
                          Cesium.Math.toDegrees(cartographic.latitude)]
                  },
                  properties: {
                      distance: distance.toFixed(2),
                      text: textDisance
                  }
              });
              temp_points.push([
                  Cesium.Math.toDegrees(cartographic.longitude),
                  Cesium.Math.toDegrees(cartographic.latitude)
              ])
  
              if (temp_points.length >= 2) {
                  geoJsonData.features.push({
                      type: "Feature",
                      geometry: {
                          type: "LineString",
                          coordinates: [temp_points[temp_points.length-2],temp_points[temp_points.length-1]]
                      },
                      properties: {
                          totalDistance: distance.toFixed(2)
                      }
                  });
              }
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

    //内部测量面积函数
    const measureAreaSpace = (viewer, handleAddGeoJsonData) => {
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene._imageryLayerCollection);
    var positions = [];
    var tempPoints = [];
    var polygon = null;
    // var tooltip = document.getElementById("toolTip");
    var cartesian = null;
    var floatingPoint; //浮动点
    // tooltip.style.display = "block";

    handler.setInputAction(function (movement) {
        // tooltip.style.left = movement.endPosition.x + 3 + "px";
        // tooltip.style.top = movement.endPosition.y - 25 + "px";
        // tooltip.innerHTML ='<p>单击开始，右击结束</p>';
        cartesian = viewer.scene.pickPosition(movement.endPosition);
        if (!Cesium.defined(cartesian)) {
            let ray = viewer.camera.getPickRay(movement.endPosition);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
        if (positions.length >= 2) {
            if (!Cesium.defined(polygon)) {
                polygon = new PolygonPrimitive(positions);
            } else {
                positions.pop();
                // cartesian.y += (1 + Math.random());
                positions.push(cartesian);
            }
            // tooltip.innerHTML='<p>'+distance+'米</p>';
        }
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    handler.setInputAction(function (movement) {
        // tooltip.style.display = "none";
        cartesian = viewer.scene.pickPosition(movement.position);
        if (!Cesium.defined(cartesian)) {
            let ray = viewer.camera.getPickRay(movement.position);
            cartesian = viewer.scene.globe.pick(ray, viewer.scene);
        }
        // cartesian = viewer.scene.camera.pickEllipsoid(movement.position, viewer.scene.globe.ellipsoid);
        if (positions.length == 0) {
            positions.push(cartesian.clone());
        }
        //positions.pop();
        positions.push(cartesian);
        //在三维场景中添加点
        var cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
        var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
        var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
        var heightString = cartographic.height;
        tempPoints.push({
            lon: longitudeString,
            lat: latitudeString,
            hei: heightString
        });
        floatingPoint = viewer.entities.add({
            name: '多边形面积',
            position: positions[positions.length - 1],
            point: {
                pixelSize: 3,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    handler.setInputAction(function (movement) {
        handler.destroy();
        positions.pop();
        //tempPoints.pop();
        // viewer.entities.remove(floatingPoint);
        // tooltip.style.display = "none";
        //在三维场景中添加点
        // var cartographic = Cesium.Cartographic.fromCartesian(positions[positions.length - 1]);
        // var longitudeString = Cesium.Math.toDegrees(cartographic.longitude);
        // var latitudeString = Cesium.Math.toDegrees(cartographic.latitude);
        // var heightString = cartographic.height;
        // tempPoints.push({ lon: longitudeString, lat: latitudeString ,hei:heightString});
        var a = getArea(tempPoints);
        if (a < 0.001) {
            a = (a * 1000000).toFixed(4) + "平方米";
        } else {
            a = a.toFixed(4) + "平方公里";
        }
        var textArea = a;
        var et = viewer.entities.add({
            name: '多边形面积',
            position: positions[positions.length - 1],
            // point : {
            //  pixelSize : 5,
            //  color : Cesium.Color.RED,
            //  outlineColor : Cesium.Color.WHITE,
            //  outlineWidth : 2,
            //  heightReference:Cesium.HeightReference.CLAMP_TO_GROUND
            // },
            label: {
                text: textArea,
                font: '18px sans-serif',
                fillColor: Cesium.Color.CYAN,
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(20, -40),
                disableDepthTestDistance: Number.POSITIVE_INFINITY,
                heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
            }
        });
        viewer._container.style.cursor = "";

        function cartesianToLonLatHeight(cartesian) {
            const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            return [
                Cesium.Math.toDegrees(cartographic.longitude),
                Cesium.Math.toDegrees(cartographic.latitude),
                cartographic.height
            ];
        }

        const cartesianp = positions.map(cartesianToLonLatHeight);

        const geoJsonData = {
            "type": "FeatureCollection",
            "features": [
                {
                    type: "Feature",
                    geometry: { type: "Polygon", coordinates: [cartesianp.concat([cartesianp[0]])] }, // 闭合底面
                    properties: {"name": "地表面积", "面积": textArea}
                }]
        };

        handleAddGeoJsonData({"id": Cesium.createGuid(), "data": geoJsonData, "type": "地表面积"});
    }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

    var radiansPerDegree = Math.PI / 180.0; //角度转化为弧度(rad)
    var degreesPerRadian = 180.0 / Math.PI; //弧度转化为角度

    //计算多边形面积
    function getArea(points) {

        var res = 0;
        //拆分三角曲面

        for (var i = 0; i < points.length - 2; i++) {
            var j = (i + 1) % points.length;
            var k = (i + 2) % points.length;
            var totalAngle = Angle(points[i], points[j], points[k]);


            var dis_temp1 = distance(positions[i], positions[j]);
            var dis_temp2 = distance(positions[j], positions[k]);
            res += dis_temp1 * dis_temp2 * Math.abs(Math.sin(totalAngle));
        }
        return (res / 1000000.0);
    }

    /*角度*/
    function Angle(p1, p2, p3) {
        var bearing21 = Bearing(p2, p1);
        var bearing23 = Bearing(p2, p3);
        var angle = bearing21 - bearing23;
        if (angle < 0) {
            angle += 360;
        }
        return angle;
    }
    /*方向*/
    function Bearing(from, to) {
        var lat1 = from.lat * radiansPerDegree;
        var lon1 = from.lon * radiansPerDegree;
        var lat2 = to.lat * radiansPerDegree;
        var lon2 = to.lon * radiansPerDegree;
        var angle = -Math.atan2(Math.sin(lon1 - lon2) * Math.cos(lat2), Math.cos(lat1) * Math.sin(lat2) - Math
            .sin(lat1) * Math.cos(lat2) * Math.cos(lon1 - lon2));
        if (angle < 0) {
            angle += Math.PI * 2.0;
        }
        angle = angle * degreesPerRadian; //角度
        return angle;
    }

    var PolygonPrimitive = (function () {
        function _(positions) {
            this.options = {
                name: '多边形',
                polygon: {
                    hierarchy: [],
                    // perPositionHeight : true,
                    material: Cesium.Color.DARKTURQUOISE.withAlpha(0.4),
                    outlineColor: Cesium.Color.CYAN.withAlpha(0.8),
                    // heightReference:20000
                }
            };

            this.hierarchy = {
                positions
            };
            this._init();
        }

        _.prototype._init = function () {
            var _self = this;
            var _update = function () {
                return _self.hierarchy;
            };
            //实时更新polygon.hierarchy
            this.options.polygon.hierarchy = new Cesium.CallbackProperty(_update, false);
            var et = viewer.entities.add(this.options);
        };

        return _;
    })();

    function distance(point1, point2) {
        var point1cartographic = Cesium.Cartographic.fromCartesian(point1);
        var point2cartographic = Cesium.Cartographic.fromCartesian(point2);
        /**根据经纬度计算出距离**/
        var geodesic = new Cesium.EllipsoidGeodesic();
        geodesic.setEndPoints(point1cartographic, point2cartographic);
        var s = geodesic.surfaceDistance;
        //console.log(Math.sqrt(Math.pow(distance, 2) + Math.pow(endheight, 2)));
        //返回两点之间的距离
        s = Math.sqrt(Math.pow(s, 2) + Math.pow(point2cartographic.height - point1cartographic.height, 2));
        return s;
    }
}


    //高度差
    const altitude = (viewer) => {
        var trianArr = [];
        var distanceLineNum = 0;
        var Line1, Line2;
        var H;
        var floatingPoint; //浮动点
        const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
        handler.setInputAction(function (movement) {
            var cartesian = viewer.scene.pickPosition(movement.endPosition);
            if (!Cesium.defined(cartesian)) {
                var ray = viewer.camera.getPickRay(movement.endPosition);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            }
            //cartesian = viewer.scene.camera.pickEllipsoid(movement.endPosition, viewer.scene.globe.ellipsoid);
            if (distanceLineNum === 1) {
                var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                var lon = Cesium.Math.toDegrees(cartographic.longitude);
                var lat = Cesium.Math.toDegrees(cartographic.latitude);
                var MouseHeight = cartographic.height;
                trianArr.length = 3;
                trianArr.push(lon, lat, MouseHeight);
                draw_Triangle();
            }
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        handler.setInputAction(function (movement) {
            var cartesian = viewer.scene.pickPosition(movement.position);
            if (!Cesium.defined(cartesian)) {
                var ray = viewer.camera.getPickRay(movement.position);
                cartesian = viewer.scene.globe.pick(ray, viewer.scene);
            }

            // var cartesian = viewer.scene.pickPosition(movement.position);
            var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
            var lon = Cesium.Math.toDegrees(cartographic.longitude);
            var lat = Cesium.Math.toDegrees(cartographic.latitude);
            var MouseHeight = cartographic.height;

            floatingPoint = viewer.entities.add({
                name: '多边形面积',
                position: cartesian,
                point: {
                    pixelSize: 3,
                    color: Cesium.Color.RED,
                    outlineColor: Cesium.Color.WHITE,
                    outlineWidth: 2,
                    heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
                }
            });

            distanceLineNum++;
            if (distanceLineNum === 1) {
                trianArr.push(lon, lat, MouseHeight);

            } else {
                trianArr.length = 3;
                trianArr.push(lon, lat, MouseHeight);
                handler.destroy();
                viewer._container.style.cursor = "";
                draw_Triangle();
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(function (movement) {
            handler.destroy();
            viewer._container.style.cursor = "";
        }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);

        function draw_Triangle() {
            if (Cesium.defined(Line1)) {
                //更新三角线
                Line1.polyline.positions = trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([
                    trianArr[0],
                    trianArr[1], trianArr[5], trianArr[0], trianArr[1], trianArr[2]
                ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[3], trianArr[4], trianArr[2], trianArr[
                    3], trianArr[4], trianArr[5]]);
                Line2.polyline.positions = trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([
                    trianArr[0],
                    trianArr[1], trianArr[5], trianArr[3], trianArr[4],
                    trianArr[5]
                ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[3], trianArr[4], trianArr[2], trianArr[
                    0], trianArr[1], trianArr[2]]);

                //高度
                var height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);
                H.position = trianArr[5] > trianArr[2] ? Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1], (
                    trianArr[2] + trianArr[5]) / 2) : Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4], (
                    trianArr[2] + trianArr[5]) / 2);
                H.label.text = '高度差:' + height + '米';
                return;
            }
            Line1 = viewer.entities.add({
                name: 'triangleLine',
                polyline: {
                    positions: trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[0],
                        trianArr[1], trianArr[5], trianArr[0], trianArr[1], trianArr[2]
                    ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[3], trianArr[4], trianArr[2], trianArr[
                        3], trianArr[4], trianArr[5]]),
                    arcType: Cesium.ArcType.NONE,
                    width: 2,
                    material: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.CHARTREUSE
                    }),
                    depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                        color: Cesium.Color.RED
                    })
                }
            });
            Line2 = viewer.entities.add({
                name: 'triangleLine',
                polyline: {
                    positions: trianArr[5] > trianArr[2] ? new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[0],
                        trianArr[1], trianArr[5], trianArr[3], trianArr[4],
                        trianArr[5]
                    ]) : new Cesium.Cartesian3.fromDegreesArrayHeights([trianArr[3], trianArr[4], trianArr[2], trianArr[
                        0], trianArr[1], trianArr[2]]),
                    arcType: Cesium.ArcType.NONE,
                    width: 2,

                    // material: new Cesium.PolylineOutlineMaterialProperty({
                    material: new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.CHARTREUSE,
                        // dashLength: 5,
                        // dashPattern: 10,
                        // gapColor:Cesium.Color.YELLOW
                    }),
                    // depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                    depthFailMaterial: new Cesium.PolylineDashMaterialProperty({
                        color: Cesium.Color.RED
                    })
                }
            });

            // 空间
            var lineDistance = Cesium.Cartesian3.distance(Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1]),
                Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4])).toFixed(2);
            //高度
            var height = Math.abs(trianArr[2] - trianArr[5]).toFixed(2);
            H = viewer.entities.add({
                name: 'lineZ',
                position: trianArr[5] > trianArr[2] ? Cesium.Cartesian3.fromDegrees(trianArr[0], trianArr[1], (
                    trianArr[2] + trianArr[5]) / 2) : Cesium.Cartesian3.fromDegrees(trianArr[3], trianArr[4], (
                    trianArr[2] + trianArr[5]) / 2),
                label: {
                    text: '高度差:' + height + '米',
                    translucencyByDistance: new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e5, 0),
                    font: '45px 楷体',
                    fillColor: Cesium.Color.WHITE,
                    outlineColor: Cesium.Color.BLACK,
                    style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                    outlineWidth: 3,
                    disableDepthTestDistance: Number.POSITIVE_INFINITY,
                    scale: 0.5,
                    pixelOffset: new Cesium.Cartesian2(0, -10),
                    backgroundColor: new Cesium.Color.fromCssColorString("rgba(0, 0, 0, 0.7)"),
                    backgroundPadding: new Cesium.Cartesian2(10, 10),
                    verticalOrigin: Cesium.VerticalOrigin.BOTTOM
                }
            });
        }
    }


  export {measureLineSpace, measureGroundDistance, measureAreaSpace, altitude};