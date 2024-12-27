// 编辑代码

var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
let eventType= Cesium.ScreenSpaceEventType.LEFT_CLICK
function addPoint(screenPosition) {
    console.log(112)
    const { scene } = viewer;
    const ellipsoid = scene.globe.ellipsoid;
    const cartesian = viewer.camera.pickEllipsoid(screenPosition, ellipsoid);
    const cartographic = ellipsoid.cartesianToCartographic(cartesian);
    const longitude = Cesium.Math.toDegrees(cartographic.longitude);
    const latitude = Cesium.Math.toDegrees(cartographic.latitude);
    console.log(1123)
    const point = new Cesium.Entity({
        position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2000),
        point: {
            pixelSize: 10,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
        },
    });
    viewer.entities.add(point)
}

handler.setInputAction(event=>{
    // console.log(event.position);
    addPoint(event.position)
}, eventType);