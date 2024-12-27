import Cesium from 'cesium'


class MeasureTool {
    constructor(option) {
      this.viewer = option.viewer;
      this.terrainProvider = option.terrainProvider;
      this.options = option;
      var me = this;
      if (option.show !== false) {
        if (option.target) {
          this.dom = document.getElementById(option.target);
          this.dom.classList.add("measureTool");
          if (option.classname) {
            this.dom.classList.add(option.classname);
          }
        } else {
          var div = document.createElement("div");
          div.className = "measureTool measureTool_" + (option.classname ? " " + option.classname : "");
          document.body.appendChild(div);
          this.dom = div;
        }
  
        // 创建空间测量按钮
        var btnDistance = document.createElement("div");
        btnDistance.className = "measureItem";
        btnDistance.innerHTML = "空间距离";
        btnDistance.onclick = function () {
          this.classList.add("selItembox1");
          me.btnclick("空间距离");
        };
        this.dom.appendChild(btnDistance);
  
        // 创建清除结果按钮
        var btnClear = document.createElement("div");
        btnClear.className = "measureItem";
        btnClear.innerHTML = "清除结果";
        btnClear.onclick = function () {
          me.btnclick("清除结果");
        };
        this.dom.appendChild(btnClear);
  
        // 处理点击事件
        document.onclick = function (e) {
          var len = document.querySelectorAll(".selItembox1").length;
          if (
            e.target.className !== "" &&
            e.target.className.indexOf("selItembox1") >= 0 &&
            len == 1
          ) {
            return;
          }
          if (len > 0) {
            if (len > 1) {
              var all = document.querySelectorAll(".selItembox1");
              for (var a = 0; a < all.length; a++) {
                if (all[a] !== e.target) {
                  all[a].classList.remove("selItembox1");
                }
              }
            } else {
              document.querySelector(".selItembox1").classList.remove("selItembox1");
            }
          }
        };
      }
      this.bMeasuring = false;
      me.viewer._container.style.cursor = "";
      this.measureIds = [];
    }
  
    // 点击事件
    btnclick(type) {
      var me = this;
      if (type !== "清除结果") {
        if (me.bMeasuring)
          if (me.handler && !me.handler.isDestroyed())
            me.handler = me.handler && me.handler.destroy();
      }
      switch (type) {
        case "空间距离":
          me.bMeasuring = true;
          me.viewer._container.style.cursor = "crosshair";
          me._measureLineSpace();
          break;
        case "清除结果":
          for (var jj = 0; jj < me.measureIds.length; jj++) {
            me.viewer.entities.removeById(me.measureIds[jj]);
          }
          me.measureIds.length = 0;
          if (me.handler && !me.handler.isDestroyed())
            me.handler = me.handler && me.handler.destroy();
          break;
      }
    }
  
    _finishMeasure() {
      var me = this;
      me.btnclick("清除结果");
      me.bMeasuring = false;
      me.viewer._container.style.cursor = "";
      document.getElementsByClassName("measureTool")[0].parentNode.removeChild(document.getElementsByClassName("measureTool")[0]);
    }

        //空间距离测量
        _measureLineSpace() {
            var me = this;
            var viewer = this.viewer;
            me.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
            var positions = [];
            var poly = null;
            var distance = 0;
            var cartesian = null;
            var floatingPoint;
            //监听移动事件
            me.handler.setInputAction(function (movement) {
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
            me.handler.setInputAction(function (movement) {
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
                    var distance_add = parseFloat(getSpaceDistance(positions));
                    distance += distance_add;
                    //在三维场景中添加Label
                    var textDisance = ((distance > 1000) ? (distance / 1000).toFixed(3) + '千米' : distance.toFixed(2) + '米') + "\n(+" + (distance_add > 1000 ? (distance_add / 1000).toFixed(3) + '千米' : distance_add + '米') + ")"
                    // var textDisance = distance + "米";
                    // if (distance > 1000) {
                    //     textDisance = (parseFloat(distance) / 1000).toFixed(3) + "千米";
                    // }
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
                            heightReference: Cesium.HeightReference.NONE
                        }
                    });
                    me.measureIds.push(floatingPoint.id);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
            //监听双击事件
            me.handler.setInputAction(function (movement) {
                me.handler.destroy(); //关闭事件句柄
                positions.pop(); //最后一个点无效
                me.bMeasuring = false;
                viewer._container.style.cursor = "";
            }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    
            //绘线效果1
            var PolyLinePrimitive = (function () {
                function _(positions) {
                    this.options = {
                        name: '直线',
                        polyline: {
                            show: true,
                            positions: [],
                            arcType: Cesium.ArcType.NONE,
                            // material: new Cesium.PolylineOutlineMaterialProperty({
                            //     color: Cesium.Color.CHARTREUSE
                            // }),
                            material: Cesium.Color.CHARTREUSE,
                            // depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
                            //     color: Cesium.Color.RED
                            // }),
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
                    me.measureIds.push(et.id);
                };
    
                return _;
            })();
    
            //空间两点距离计算函数
            function getSpaceDistance(positions) {
                var distance_ = 0;
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
                return distance_.toFixed(2);
            }
    
        }
  }
  
  export default MeasureTool;
  