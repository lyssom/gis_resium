import * as Cesium from "cesium";

var line1;
var line2;



function load(viewer, start, end, messageApi) {
    var hello = viewer.entities.add({
        name: '观测点',
        position: start,
        point: {
            pixelSize: 5,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
        },
        label: {
            text: '观测点',
            font: '14pt monospace',
            outlineWidth: 2,
        }
    });
    
    var word = viewer.entities.add({
        name: '目的点',
        position: end,
        point: {
            pixelSize: 5,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
        },
        label: {
            text: '目的点',
            font: '14pt monospace',
            outlineWidth: 2,
        }
    });

    var center = sightline(start, end, viewer);
    console.log("障碍点坐标-------------------------" + center)

    if (center.x == 0 && center.y == 0 && center.z == 0) {
        // alert("可视")
        const success = () => {
            messageApi.open({
              type: 'success',
              content: '可视',
            });
        };
        success();
        line1 = viewer.entities.add({
            polyline: {
                positions: [start, end],
                width: 3,
                material: Cesium.Color.GREEN,
                clampToGround: false,
            }
        });
    } else {
        const success = () => {
            messageApi.open({
              type: 'success',
              content: '不可视',
            });
        };
        success();

        line1 = viewer.entities.add({
            polyline: {
                positions: [start, center],
                width: 3,
                material: Cesium.Color.GREEN,
                clampToGround: false,
            }
        });
        line2 = viewer.entities.add({
            polyline: {
                positions: [center, end],
                width: 3,
                material: Cesium.Color.RED,
                clampToGround: false,
            }
        });
    }


}


function sightline(startWorldPoint, endWorldPoint, viewer) {
    var barrierPoint = Cesium.Cartesian3.ZERO;
    var startPoint = convertCartesian3ToCartesian2(viewer, startWorldPoint);
    var endPoint = convertCartesian3ToCartesian2(viewer, endWorldPoint);
    var worldLength = calculateSpatialDistance(startWorldPoint, endWorldPoint);
    var windowLength = calculateWindowDistance(startPoint, endPoint);
    var worldInterval = worldLength / 100.0;
    var windowInterval = windowLength / 100.0;
    for (var i = 1; i < 100; i++) {
        var tempWindowPoint = findWindowPositionByPixelInterval(startPoint, endPoint, windowInterval * i);
        var tempPoint = findCartesian3ByDistance(startWorldPoint, endWorldPoint, worldInterval * i);
        var surfacePoint = pickCartesian(viewer, tempWindowPoint);
        // console.log("surfacePoint", surfacePoint)
        var tempRad = Cesium.Cartographic.fromCartesian(tempPoint);
        console.log(surfacePoint.cartesian)
        if (surfacePoint.cartesian) {
            var surfaceRad = Cesium.Cartographic.fromCartesian(surfacePoint.cartesian);
            if (surfaceRad.height > tempRad.height) {
                barrierPoint = tempPoint;
                break;
            }
        }
    }
    return barrierPoint;
}

function convertCartesian3ToCartesian2(viewer, position) {
    return Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene, position);
}
function calculateSpatialDistance(startPoint, endPoint) {
    return Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2) + Math.pow(endPoint.z - startPoint.z, 2));
}
function calculateWindowDistance(startPoint, endPoint) {
    return Math.sqrt(Math.pow(endPoint.y - startPoint.y, 2) + Math.pow(endPoint.x - startPoint.x, 2));
}
function findWindowPositionByPixelInterval(startPosition, endPosition, interval) {
    var result = new Cesium.Cartesian2(0, 0);
    var length = Math.sqrt(Math.pow(endPosition.x - startPosition.x, 2) + Math.pow(endPosition.y - startPosition.y, 2));
    if (length < interval) {
        return result;
    }
    else {
        var x = (interval / length) * (endPosition.x - startPosition.x) + startPosition.x;
        var y = (interval / length) * (endPosition.y - startPosition.y) + startPosition.y;
        result.x = x;
        result.y = y;
    }
    return result;
}
function findCartesian3ByDistance(startPosition, endPosition, interval) {
    var result = new Cesium.Cartesian3(0, 0, 0);
    var length = Math.sqrt(Math.pow(endPosition.z - startPosition.z, 2) + Math.pow(endPosition.x - startPosition.x, 2) + Math.pow(endPosition.y - startPosition.y, 2));
    if (length < interval) {
        return result;
    }
    else {
        var x = (interval / length) * (endPosition.x - startPosition.x) + startPosition.x;
        var y = (interval / length) * (endPosition.y - startPosition.y) + startPosition.y;
        var z = (interval / length) * (endPosition.z - startPosition.z) + startPosition.z;
        result.x = x;
        result.y = y;
        result.z = z;
    }
    return result;
}
function pickCartesian(viewer, windowPosition) {
    //根据窗口坐标，从场景的深度缓冲区中拾取相应的位置，返回笛卡尔坐标。
    var cartesianModel = viewer.scene.pickPosition(windowPosition);
    //场景相机向指定的鼠标位置（屏幕坐标）发射射线
    var ray = viewer.camera.getPickRay(windowPosition);
    //获取射线与三维球相交的点（即该鼠标位置对应的三维球坐标点，因为模型不属于球面的物体，所以无法捕捉模型表面）
    var cartesianTerrain = viewer.scene.globe.pick(ray, viewer.scene);
    // var result = new PickResult();
    var result = {};
    if (typeof (cartesianModel) !== 'undefined' && typeof (cartesianTerrain) !== 'undefined') {
        result.cartesian = cartesianModel || cartesianTerrain;
        result.CartesianModel = cartesianModel;
        result.cartesianTerrain = cartesianTerrain;
        result.windowCoordinates = windowPosition.clone();
        //坐标不一致，证明是模型，采用绝对高度。否则是地形，用贴地模式。
        result.altitudeMode = cartesianModel.z.toFixed(0) !== cartesianTerrain.z.toFixed(0) ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND;
    }
    return result;
}

function removeEntityByName(name, viewer) {
    // 遍历所有实体
    viewer.entities.values.forEach(function(entity) {
        if (entity.name === name) {
            // 移除与指定名称匹配的实体
            viewer.entities.remove(entity);
            console.log("Entity removed: " + name);
        }
    });
}

function clears(viewer) {
    viewer.entities.remove(line1);
    viewer.entities.remove(line2);
    removeEntityByName("目的点", viewer);
    removeEntityByName("观测点", viewer);
}

export { load, clears};