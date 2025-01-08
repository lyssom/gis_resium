import { useEffect, useState, useRef, use } from "react";
import * as Cesium from "cesium";
import { Col, InputNumber, Row, Slider, Space } from 'antd';

import { Editor } from "@monaco-editor/react";
import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Drawer, FloatButton, List, Typography, Flex, Splitter, Modal, Checkbox, Switch, Divider, Collapse, Radio, Form, Input, Select } from 'antd';
import { AimOutlined, DeleteOutlined, LineOutlined, PlusSquareOutlined, EnvironmentOutlined, DeploymentUnitOutlined } from '@ant-design/icons';
import "./index.css"
import excavateTerrain from "./excavateTerrain.js"
import {load, clears } from "./line_of_sight.js"
import { message } from 'antd';

import {measureLineSpace, measureGroundDistance} from "./measureTool.js"


import {getSceneDetail, saveSceneDetail, getSceneList, getImageDatas, saveImageData} from '../../api/index.js'

const ViewerPage = () => {
  const [code, setCode] = useState(`// 编辑代码
  `);
  const [eiditerSize, setEiditerSize] = useState('0%');
  const [inputValue, setInputValue] = useState(1);
  const viewerRef = useRef(null); 
  const viewer = useRef(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalImportOpen, setIsModalImportOpen] = useState(false);
  const [isModalImportDataOpen, setIsModalImportDataOpen] = useState(false);
  const [isModalLocationOpen, setIsModalLocationOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [divPosition, setDivPosition] = useState('0px');

  const [tiananmenValue, setTiananmenValue] = useState(false);
  const [LjzValue, setLjzValue] = useState(false);
  const [layers, setLayers] = useState([])
  const [layers3D, setLayers3D] = useState([])

  const CheckboxGroup = Checkbox.Group
  const plainOptions = ['代码', '实体'];
  const defaultCheckedList = ['代码', '实体'];

  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const [allEntities, setAllEntities] = useState([]);

  const [entitiesList, setEntitiesList] = useState([]);
  const [entities, setEntities] = useState([]);

  const [LogLatposition, setPosition] = useState(null);

  const checkAll = plainOptions.length === checkedList.length;
  const indeterminate = checkedList.length > 0 && checkedList.length < plainOptions.length;
  const [messageApi, contextHolder] = message.useMessage();
  const [terrainList, setTerrainList] = useState([])
  const [tilesList, setTilesList] = useState([])
  const [wmsList, setWmsList] = useState([])
  const [selectedTerrainId, setSelectedTerrainId] = useState(null)
  const [exportSenceName, setExportSenceName] = useState('')

  const [coordinates, setCoordinates] = useState({
    longitude: '',
    latitude: '',
    altitude: ''
  });

  const [importDatacoordinates, setimportDataCoordinates] = useState({
    dataType: '',
    dataName: '',
    dataUrl: '',
    longitude: '',
    latitude: '',
    altitude: ''
  });

  const handleLocationChange = (e) => {
    setCoordinates({
      ...coordinates,
      [e.target.name]: e.target.value
    });
  };

  const handleImportDataChange = (e) => {
    setimportDataCoordinates({
      ...importDatacoordinates,
      [e.target.name]: e.target.value
    });
    console.log(e.target.name)
    console.log(e.target.value)
    console.log(importDatacoordinates.dataName)
  };

  const handleImportDataChangeDataType = (e) => {
    setimportDataCoordinates({
      dataType: e
    });

  };


  const handleexportSenceName = (e) => {
    setExportSenceName(e.target.value);
  };

  const showImportDataModal = () => {
    setIsModalImportDataOpen(true);
  };


  const onExaggerChange = (newValue) => {
    setInputValue(newValue);
  };

  const onEditerChange = (checked) => {
    console.log(`switch to ${checked}`);
    if (checked) {
      setEiditerSize('50%');
    } else {
      setEiditerSize('0%');
    }
  };
  
  const showDrawer = () => {
    setVisible(true);
    setDivPosition('250px');
  };

  const onClose = () => {
    setVisible(false);
    setDivPosition('0px');
  };

  const onCheckedListChange = (list) => {
    setCheckedList(list);
  };
  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? plainOptions : []);
  };
  const showEdt = () => {
    setEiditerSize('50%');
  };

  const handleTiananmen = () => {
    setTiananmenValue(!tiananmenValue);
  };

  const handleLjz = () => {
    setLjzValue(!LjzValue);
  };


  const fly2Tiananmen = () => {
    const rectangle = Cesium.Rectangle.fromDegrees(
      116.3836, // west
      39.9055,  // south
      116.39, // east
      39.91
    );

    viewer.current.camera.flyTo({
      destination: rectangle,
      duration: 2.0, // 飞行持续时间（秒）
      orientation: {
          heading: Cesium.Math.toRadians(0.0), // 朝向
          pitch: Cesium.Math.toRadians(-45.0), // 俯仰角
          roll: 0.0
      }
  });
  }

  const fly2Ljz = () => {

    const destination = Cesium.Cartesian3.fromDegrees(121.49270522864647, 31.240015289704218, 500); // 高度 500 米

    viewer.current.camera.flyTo({
      destination: destination,
      orientation: {
          heading: Cesium.Math.toRadians(0), // 朝东
          pitch: Cesium.Math.toRadians(-45.0), // 俯视 45 度
          roll: 0.0,
      },
      duration: 2, // 飞行时间增加到 5 秒
  });
  }

  const handleDeleteEntitiy = (id) => { // 删除实体 
    viewer.current.entities.removeById(id);
  };

  useEffect(() => {
    getImageDatas().then(res => {
      const { data } = res;
      setTerrainList(data.terrain_data);
      setTilesList(data.tiles_data);
      setWmsList(data.wms_data);
    })
  }, []); // 监听entities的变化

  const handleSelectTerrainChange = (e) => {
    console.log(e.target.value);
    setSelectedTerrainId(e.target.value.id);
    let tpurl
    if (e.target.value.data_name=='全局地形') {
      initTP();
    } else {
      terrainList.forEach(item => {
        if (item.id == e.target.value.id) {
          tpurl = item.data_url;
          console.log(tpurl);
        }
      })
      initCustomTP(tpurl);
    }
  }

  const fly2Loc = (lon, lat, alt) => {
    console.log(alt)
    if (isNaN(alt) || alt < 0 || alt == '' || alt == null) {
      alt = 100000
    }
    if (!isNaN(lon) && !isNaN(lat) ) {
      viewer.current.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt), // 经纬度和高度
        duration: 2, // 过渡时间（秒）
      });
    } else {
      alert('请输入有效的经度、纬度和高度！');
    }
  }

  const loadWMS = (url) => {
    const imageryProv =  new Cesium.TileMapServiceImageryProvider({
      url
    })

    addImageryLayer('layer_tam', imageryProv, '天安门');
  }

  const dataload_tool = [
      <div>
        <Divider>地形</Divider>
        <Radio.Group>
  <List
    dataSource={terrainList}
    split={false}
    renderItem={(item) => (
      <div className="container">
        <List.Item style={{ padding: 0 }} key={item.id}>
          <Radio
            value={item}
            checked={selectedTerrainId === item.id}
            onChange={handleSelectTerrainChange}
          />
          {item.data_name}
        </List.Item>
        {item.lon && item.lat && (
          <div style={{ marginLeft: '160px' }}>
            <Button
              type="default"
              size="small"
              icon={<AimOutlined />}
              onClick={() => fly2Loc(item.lon, item.lat, item.alt)}
            />
          </div>
        )}
      </div>
    )}
  />
</Radio.Group>

        <Divider>图层</Divider>
        {tilesList.length > 0 && (<List
        dataSource={tilesList}
        split={false}
        renderItem={(item, index) => (
          <div className="container">
        <List.Item style={{ padding: 0 }} key={index}>
        <Checkbox defaultChecked={false} onChange={() =>loadTileset(item.data_url)}/><Divider type="vertical"/>
          {item.data_name} 
        </List.Item> 
        {item.lon && item.lat && (
          <div>
            <Button 
              type="default" 
              size="small" 
              icon={<AimOutlined />} 
              onClick={() =>fly2Loc(item.lon, item.lat, item.alt)}
            />
          </div>
        )}
        </div>
        )}
        />)}
        {wmsList.length > 0 && (<List
        dataSource={wmsList}
        split={false}
        renderItem={(item, index) => (
          <div className="container">
        <List.Item style={{ padding: 0 }} key={index}>
        <Checkbox defaultChecked={false} onChange={() =>loadWMS(item.data_url)}/><Divider type="vertical"/>
          {item.data_name} 
        </List.Item> 
        {item.lon && item.lat && (
          <div>
            <Button 
              type="default" 
              size="small" 
              icon={<AimOutlined />} 
              onClick={() =>fly2Loc(item.lon, item.lat, item.alt)}
            />
          </div>
        )}
        </div>
        )}
        
        />)}
        <Divider orientation="right" orientationMargin='0'><Button size="small" onClick={showImportDataModal} icon={<PlusSquareOutlined /> } style={{float: "right"}}>添加数据</Button></Divider>
      </div>
      
      // <Button type="primary" icon={<AimOutlined />} onClick={fly2Tiananmen}></Button>,
      // <Button type="primary" onClick={handleTiles3D}>3Dtiles</Button>,
      // <Button type="primary" onClick={handleTif}>地势Tif</Button>,
      // <Button type="primary" onClick={handleTer}>高光谱融合图</Button>,
    ];

    function addPoint(screenPosition, entityType) {
      const { scene } = viewer.current;
      const ellipsoid = scene.globe.ellipsoid;
      const cartesian = viewer.current.camera.pickEllipsoid(screenPosition, ellipsoid);
      const cartographic = ellipsoid.cartesianToCartographic(cartesian);
      const longitude = Cesium.Math.toDegrees(cartographic.longitude);
      const latitude = Cesium.Math.toDegrees(cartographic.latitude);

      let ent
      if (entityType === 'point') {
        ent = new Cesium.Entity({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2000),
            point: {
                pixelSize: 10,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2,
            },
        });
      } else if (entityType === 'billboard') {
        console.log(666)
        ent = new Cesium.Entity({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2000),
            billboard: {
                image: 'http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
                scale: 1,
            },
        });
      }
      viewer.current.entities.add(ent)
  }

    const addEntity = (entityType) => {
      var handler = new Cesium.ScreenSpaceEventHandler(viewer.current.scene.canvas);
      let eventType= Cesium.ScreenSpaceEventType.LEFT_CLICK

      handler.setInputAction(event=>{
          addPoint(event.position, entityType)
      }, eventType);

      const cancelEventType = Cesium.ScreenSpaceEventType.RIGHT_CLICK;
      handler.setInputAction(() => {
        handler.removeInputAction(eventType);
        console.log("右键点击，取消监听");
      }, cancelEventType);
    }

    const addTailShape = () => {
      var drawnShapes = [];
      var handler = new Cesium.ScreenSpaceEventHandler(viewer.current.scene.canvas);
      var positions = [];
    
      handler.setInputAction(function (click) {
        var ray = viewer.current.camera.getPickRay(click.position);
        var cartesian = viewer.current.scene.globe.pick(ray, viewer.current.scene);
    
        if (Cesium.defined(cartesian)) {
          positions.push(cartesian);
    
          const ent = viewer.current.entities.add({
            position: cartesian,
            point: {
              pixelSize: 5,
              color: Cesium.Color.RED
            }
          });
          drawnShapes.push(ent);
        }
        if (positions.length === 2) {
          const MathDistance = (pnt1, pnt2) => Math.sqrt((pnt1[0] - pnt2[0]) ** 2 + (pnt1[1] - pnt2[1]) ** 2);
          const wholeDistance = (points) => {
            let distance = 0;
            if (points && Array.isArray(points) && points.length > 0) {
              points.forEach((item, index) => {
                if (index < points.length - 1) {
                  distance += MathDistance(item, points[index + 1]);
                }
              });
            }
            return distance;
          };
        
          const getBaseLength = (points) => wholeDistance(points) ** 0.99;
        
          const getAzimuth = (startPoint, endPoint) => {
            let azimuth;
            const angle = Math.asin(Math.abs(endPoint[1] - startPoint[1]) / MathDistance(startPoint, endPoint));
            if (endPoint[1] >= startPoint[1] && endPoint[0] >= startPoint[0]) {
              azimuth = angle + Math.PI;
            } else if (endPoint[1] >= startPoint[1] && endPoint[0] < startPoint[0]) {
              azimuth = Math.PI * 2 - angle;
            } else if (endPoint[1] < startPoint[1] && endPoint[0] < startPoint[0]) {
              azimuth = angle;
            } else if (endPoint[1] < startPoint[1] && endPoint[0] >= startPoint[0]) {
              azimuth = Math.PI - angle;
            }
            return azimuth;
          };
          
        
          const getThirdPoint = (startPnt, endPnt, angle, distance, clockWise) => {
            const azimuth = getAzimuth(startPnt, endPnt);
            const alpha = clockWise ? azimuth + angle : azimuth - angle;
            const dx = distance * Math.cos(alpha);
            const dy = distance * Math.sin(alpha);
            return [endPnt[0] + dx, endPnt[1] + dy];
          };

          const cartographic = Cesium.Cartographic.fromCartesian(positions[0]);
          const p1Lon = Cesium.Math.toDegrees(cartographic.longitude); // 转换为十进制经度
          const p1Lat = Cesium.Math.toDegrees(cartographic.latitude);

          const cartographic2 = Cesium.Cartographic.fromCartesian(positions[1]);
          const p2Lon = Cesium.Math.toDegrees(cartographic2.longitude); // 转换为十进制经度
          const p2Lat = Cesium.Math.toDegrees(cartographic2.latitude);

          const p1 = [p1Lon, p1Lat]
          const p2 = [p2Lon, p2Lat]

          const tailWidthFactor = 0.1;
          const neckWidthFactor = 0.2;
          const headWidthFactor = 0.25;

          const headAngle = Math.PI / 8.5;
          const neckAngle = Math.PI / 13;


          const len = getBaseLength([p1, p2]);
          const tailWidth = len * tailWidthFactor;
          const neckWidth = len * neckWidthFactor;
          const headWidth = len * headWidthFactor;
          const tailLeft = getThirdPoint(p2, p1, Math.PI / 2, tailWidth, true);
          const tailRight = getThirdPoint(p2, p1, Math.PI / 2, tailWidth, false);
          const headLeft = getThirdPoint(p1, p2, headAngle, headWidth, false);
          const headRight = getThirdPoint(p1, p2, headAngle, headWidth, true);
          const neckLeft = getThirdPoint(p1, p2, neckAngle, neckWidth, false);
          const neckRight = getThirdPoint(p1, p2, neckAngle, neckWidth, true);
          const points = [...tailLeft, ...neckLeft, ...headLeft, ...p2, ...headRight, ...neckRight, ...tailRight, ...p1];
          const cartesianPoints = Cesium.Cartesian3.fromDegreesArray(points);

          const polygonEntity = viewer.current.entities.add({
            polygon: new Cesium.PolygonGraphics({
              hierarchy: cartesianPoints,
              show: true,
              // material: style.material,
            }),
          });
          drawnShapes.push(polygonEntity);
          positions = [];
        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

      handler.setInputAction(function () {
        if (drawnShapes.length > 0) {
          for (let i = 0; i < drawnShapes.length; i++) {
            viewer.current.entities.remove(drawnShapes[i]);
          }
        }
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
    };
    

    const markTool = [
      <div className="container">
      <Button type="primary" 
      icon={<DeploymentUnitOutlined />} 
      onClick={() =>addEntity('point')}
      >点</Button>
      <Button type="primary" 
      icon={<EnvironmentOutlined />} 
      onClick={() =>addEntity('billboard')}
      >标记</Button>
      <Button type="primary" 
      icon={<EnvironmentOutlined />} 
      onClick={() =>addTailShape()}
      >燕尾图</Button>
      </div>
    ];

    const initTP = async() => {
      const wterrainProvider = await Cesium.createWorldTerrainAsync()
      viewer.current.terrainProvider = wterrainProvider;
    }

    const initCustomTP = async(url) => {
      const wterrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url)
      viewer.current.terrainProvider = wterrainProvider;
    }


    const handlExcavate = () => {
      viewer.current.scene.globe.depthTestAgainstTerrain = true;
      initTP();

    const scene = viewer.current.scene;
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    // 用于存储点击的坐标
    let firstClickPosition = null;
    let rectangleEntity = null;

    handler.setInputAction((click) => {
        const ray = viewer.current.camera.getPickRay(click.position);
        const position = viewer.current.scene.globe.pick(ray, scene);

        // 确保点击的位置有效
        if (Cesium.defined(position)) {
            if (!firstClickPosition) {
                firstClickPosition = position;
            } else {
                const rectangleCoordinates = Cesium.Rectangle.fromCartographicArray([
                    Cesium.Cartographic.fromCartesian(firstClickPosition),
                    Cesium.Cartographic.fromCartesian(position)
                ]);

                if (rectangleEntity) {
                  viewer.current.entities.remove(rectangleEntity);
                }

                rectangleEntity = viewer.current.entities.add({
                    rectangle: {
                        coordinates: rectangleCoordinates,
                        material: Cesium.Color.RED.withAlpha(0.5),
                        outline: true,
                        outlineColor: Cesium.Color.BLACK
                    }
                });

                // 输出矩形四个角的XYZ坐标
                const west = rectangleCoordinates.west;
                const south = rectangleCoordinates.south;
                const east = rectangleCoordinates.east;
                const north = rectangleCoordinates.north;

                // 计算四个角的Cartographic坐标（经纬度）
                const southwest = new Cesium.Cartographic(west, south);
                const southeast = new Cesium.Cartographic(east, south);
                const northeast = new Cesium.Cartographic(east, north);
                const northwest = new Cesium.Cartographic(west, north);

                // 将Cartographic转换为Cartesian3
                const southwestCartesian = viewer.current.scene.globe.ellipsoid.cartographicToCartesian(southwest);
                const southeastCartesian = viewer.current.scene.globe.ellipsoid.cartographicToCartesian(southeast);
                const northeastCartesian = viewer.current.scene.globe.ellipsoid.cartographicToCartesian(northeast);
                const northwestCartesian = viewer.current.scene.globe.ellipsoid.cartographicToCartesian(northwest);

                // 输出四个角的XYZ坐标
                console.log("Southwest corner (XYZ):", southwestCartesian);
                console.log("Southeast corner (XYZ):", southeastCartesian);
                console.log("Northeast corner (XYZ):", northeastCartesian);
                console.log("Northwest corner (XYZ):", northwestCartesian);

                firstClickPosition = null;

                var mr = [{
                    x: southwestCartesian.x,
                    y: southwestCartesian.y,
                    z: southwestCartesian.z
                },
                {
                    x: southeastCartesian.x,
                    y: southeastCartesian.y,
                    z: southeastCartesian.z
                },
                {
                    x: northeastCartesian.x,
                    y: northeastCartesian.y,
                    z: northeastCartesian.z
                },
                {
                    x: northwestCartesian.x,
                    y: northwestCartesian.y,
                    z: northwestCartesian.z
                }
                ];
                    new excavateTerrain(viewer.current, {
        positions: mr,
        height: 30,
        bottom: "/ter_analysis/excavationregion_side.jpg",
        side: "/ter_analysis/excavationregion_top.jpg",
    })
            }
        } else {
            console.error("Invalid position detected!");
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    const handlelineofsight = () => {
      if (viewer.current) {
        var startPoint, endPoint;
        viewer.current.scene.globe.depthTestAgainstTerrain = true;
        initTP();

        var handler = new Cesium.ScreenSpaceEventHandler(viewer.current.canvas);
      //   viewer.current.camera.setView({
      //     destination: Cesium.Cartesian3.fromDegrees(98.685331, 27.780325, 7318.6),
      //     orientation: {
      //         heading: Cesium.Math.toRadians(73),
      //         pitch: Cesium.Math.toRadians(-52.2),
      //         roll: 0.0
      //     }
      // });

        handler.setInputAction(function (click) {
            var windowPosition = click.position;
            var ray = viewer.current.camera.getPickRay(windowPosition);
            var cartesian = viewer.current.scene.globe.pick(ray, viewer.current.scene);

            if (Cesium.defined(cartesian)) {
                // 将笛卡尔坐标转换为经纬度
                var cartographic = Cesium.Cartographic.fromCartesian(cartesian);
                var lon = Cesium.Math.toDegrees(cartographic.longitude);
                var lat = Cesium.Math.toDegrees(cartographic.latitude);
                var height = cartographic.height;

                console.log("Clicked position - Lon: " + lon + ", Lat: " + lat + ", Height: " + height);

                if (!startPoint) {
                    startPoint = cartesian;
                    console.log("Start point set to: " + lon + ", " + lat + ", " + height);
                } else {
                    endPoint = cartesian;
                    console.log("End point set to: " + lon + ", " + lat + ", " + height);
                    load(viewer.current, startPoint, endPoint, messageApi);
                }
            } else {
                console.log("No valid position picked.");
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

        handler.setInputAction(function (click) {
          startPoint = undefined;
          endPoint = undefined;
          clears(viewer.current);
          
          console.log("Operation canceled, startPoint and endPoint cleared.");
      }, Cesium.ScreenSpaceEventType.RIGHT_CLICK);
      }
    }

    const handleMeasure = () => {
      measureLineSpace(viewer.current);
    }

    const handlegroundMeasure = () => {
      measureGroundDistance(viewer.current);
    }


    const measure_tool = [
      <div className='container'>
      <Button onClick={handleMeasure}>空间距离</Button>
      <Button onClick={handlegroundMeasure}>地表距离</Button>
      <Button onClick={handlExcavate}>地形开挖</Button>
      </div>,
      <Button onClick={handlelineofsight}>通视/遮蔽</Button>,
    ];

    const handleLonLat = () => {
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.current.scene.canvas);

      handler.setInputAction((movement) => {
        const cartesian = viewer.current.scene.pickPosition(movement.position);
        if (cartesian) {
          const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
          const longitude = Cesium.Math.toDegrees(cartographic.longitude);
          const latitude = Cesium.Math.toDegrees(cartographic.latitude);
          setPosition({ longitude, latitude });

        }
      }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    const showModal = () => {
      setIsModalOpen(true);
    };
    const showImportModal = () => {
      setIsModalImportOpen(true);
    };

    const showLocationModal = () => {
      setIsModalLocationOpen(true);
    };

    function addPointByImport(entityItem) {
      let point
      const entityType = entityItem.entity_type;
      const entityPosition = entityItem.position;
      const name = entityItem.name;
   
      if (entityType === 'polygon') {
        point = viewer.current.entities.add({
          polygon: new Cesium.PolygonGraphics({
            hierarchy: entityPosition.positions,
            show: true,
          }),
        });
      } else {
        const cartesian = new Cesium.Cartesian3(entityPosition.x, entityPosition.y, entityPosition.z);
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const longitude = Cesium.Math.toDegrees(cartographic.longitude);
        const latitude = Cesium.Math.toDegrees(cartographic.latitude);

        if (entityType === 'billboard') {
          point = new Cesium.Entity({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2000),
            billboard: {
                image: 'http://webapi.amap.com/theme/v1.3/markers/n/mark_b.png',
                scale: 1,
            }
          });
        }  else{
            point = new Cesium.Entity({
              name: name,
              position: Cesium.Cartesian3.fromDegrees(longitude, latitude, 2000),
              point: {
                  pixelSize: 10,
                  color: Cesium.Color.RED,
                  outlineColor: Cesium.Color.WHITE,
                  outlineWidth: 2,
              },
      });

      }
      viewer.current.entities.add(point)
      console.log(viewer.current.entities._entities)
  }}


    const importScene = () => {
      getSceneDetail({'id': selectedId}).then(res => {

        console.log(res)
        res.data.data['imagery'].forEach(item => {
          const imageryProv =  new Cesium.TileMapServiceImageryProvider({
            url: item.url,
          })
          addImageryLayer(selectedId, imageryProv, '场景_' + selectedId + '_' +item.name);
        })
        res.data.data['entities'].forEach(item => {
          addPointByImport(item);
        })
        setCode(res.data.code)

      })
      handleImportCancel()

    }

    const handleLocationSubmit = () => {
      const { longitude, latitude, altitude } = coordinates;
      console.log(longitude, latitude, altitude)

      // 将输入的经纬度转换为 Cesium 的 Cartesian3 坐标系
      const lon = parseFloat(longitude);
      const lat = parseFloat(latitude);
      const alt = parseFloat(altitude);

      if (!isNaN(lon) && !isNaN(lat) && !isNaN(alt)) {
        viewer.current.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(lon, lat, alt), // 经纬度和高度
          duration: 2, // 过渡时间（秒）
        });
        setCoordinates({
          longitude: '',
          latitude: '',
          altitude: ''
        });
        handleLocationCancel()
      } else {
        alert('请输入有效的经度、纬度和高度！');
      }
      
    }

    const handleImportDataSubmit = () => {
      const { dataType, dataName, dataUrl, longitude, latitude, altitude } = importDatacoordinates;
      console.log(longitude, latitude, altitude)

      console.log(dataType, dataName, dataUrl)

      // 将输入的经纬度转换为 Cesium 的 Cartesian3 坐标系
      const lon = parseFloat(longitude);
      const lat = parseFloat(latitude);
      const alt = parseFloat(altitude);

      const jsonOutput = JSON.stringify(
        {"data_type": dataType, "data_name":dataName, "data_url":dataUrl, "lon":lon, "lat":lat, 'alt': alt},
        null, 2);

      saveImageData({'data': JSON.parse(jsonOutput)}).then(res => {
        console.log(res);
      })

      setimportDataCoordinates({
        dataType: '',
        dataName: '',
        dataUrl: '',
        longitude: '',
        latitude: '',
        altitude: ''
      });

      getImageDatas().then(res => {
        const { data } = res;
        setTerrainList(data.terrain_data);
        setTilesList(data.tiles_data);
        setWmsList(data.wms_data);
      })
      handleImportDataCancel() 
    }

  
    const highLevelTool = [
    <div>
          <Space
      direction="vertical"
    >
      <Row><p>代码编辑器<Divider type="vertical"/><Switch defaultChecked={false} onChange={onEditerChange} /></p></Row>
      <Row>
      <p>地形夸张</p>
        <Col span={12}>
          <Slider
            min={1}
            max={10}
            style={{ margin: '16px 16px' }}
            onChange={onExaggerChange}
            value={inputValue}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={1}
            max={10}
            style={{ margin: '8px 24px' }}
            value={inputValue}
            onChange={onExaggerChange}
          />
        </Col>
      </Row>
      {/* <Row><Button onClick={handleLonLat}>经纬度显示</Button></Row> */}
      <Row><Button type="primary" onClick={showLocationModal}>位置跳转</Button></Row>
    </Space>
    </div>
    ];

    const sceneTool = [
      <div>
        <Divider>实体</Divider>
        <List
      dataSource={entities}
      renderItem={(item, index) => (
        <List.Item key={index}>
          <Typography.Text mark></Typography.Text>  {item._name ? item._name : 'entity_' + index}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteEntitiy(item.id)} // 删除按钮点击事件
            style={{ marginLeft: 'auto' }} // 确保按钮在右侧
          />
        </List.Item>
      )}
    />
    <Divider>图层</Divider>
            <List
      dataSource={layers}
      renderItem={(item, index) => (
        console.log(item),
        <List.Item key={index}>
          <Typography.Text mark></Typography.Text>  {item.layer.name ? item.layer.name : 'layer_' + index}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteEntitiy(item.id)} // 删除按钮点击事件
            style={{ marginLeft: 'auto' }} // 确保按钮在右侧
          />
        </List.Item>
      )}
    />
        <div className="container">
        <Row><Button type="primary" onClick={showImportModal}>导入场景</Button></Row>
        <Row><Button type="primary" onClick={showModal}>导出场景</Button></Row>
        </div>
      </div>
      ];


  Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZjQ5ZGUzNC1jNWYwLTQ1ZTMtYmNjYS05YTY4ZTVmN2I2MDkiLCJpZCI6MTE3MTM4LCJpYXQiOjE2NzY0NDUyODB9.ZaNSBIfc1sGLhQd_xqhiSsc0yr8oS0wt1hAo9gbke6M";

  const handleCancel = () => {
    setIsModalOpen(false);
  }

  const handleImportCancel = () => {
    setIsModalImportOpen(false);
  }

  const handleLocationCancel = () => {
    setIsModalLocationOpen(false);
  }

  const handleImportDataCancel = () => {
    setIsModalImportDataOpen(false);
  }

  const handleExport = () => {
    let exportId
    if (selectedId) {
      exportId = selectedId
    } else {
      exportId = 0
    }

    const entitiesData = [];
    let entityType;
    let position;
    const allEntities = viewer.current.entities.values;
    console.log(allEntities); // 输出所有实体
    for (let i = 0; i < allEntities.length; i++) {
      const entity = allEntities[i];

      if (entity.billboard) {
        entityType = "billboard"
        position = entity.position.getValue(Cesium.JulianDate.now());
      } else if (entity.polygon){
        entityType = "polygon"
        position = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
      } else {
        entityType = "point"
        position = entity.position.getValue(Cesium.JulianDate.now());
      }

      entitiesData.push({
        name: entity.name,
        position,
        entity_type: entityType
      });
    }

    console.log(entitiesData)
    console.log(code);

    const imageriesData = [];

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      imageriesData.push({
        name: layer.layer.name,
        url:layer.layer.imageryProvider.url,
      });
    }

    console.log(imageriesData)
    console.log(11122);

    const jsonOutput = JSON.stringify(
      {"imagery":imageriesData, "entities":entitiesData},
      null, 2);
    console.log(jsonOutput);
    saveSceneDetail({'data': JSON.parse(jsonOutput), "code": code, "name": exportSenceName, "id": exportId}).then(res => {
      console.log(res);
    })

    getSceneList().then(res => {
      setsceneLists(res.data)
    })

    console.log("1111")
    console.log(sceneLists)
    setExportSenceName("")
  }

  useEffect(() => {
    if (entities.length > 0) {
      console.log("Entities have been updated:", entities);
    }
  }, [entities]); // 监听entities的变化

  useEffect(() => {
    // 创建 Viewer 实例
    const viewerInstance = new Cesium.Viewer(viewerRef.current, {
      animation: false,
      timeline: false,
      geocoder: false,
      baseLayerPicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      navigationInstructionsInitiallyVisible: false,


        // terrain: new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl(
        //   // "http://data.mars3d.cn/terrain/"
        //   "http://localhost:8000/tiles"
        //   ))
    });
    
    viewer.current = viewerInstance;
    viewer.current.cesiumWidget.creditContainer.style.display = "none";
    const updateEntities = () => {
      setEntities(viewerInstance.entities.values);
    };
    const entitiesChangedListener = viewerInstance.entities.collectionChanged.addEventListener(updateEntities);
    
    // viewerInstance.entities.add({
    //   name: '丰润区中心点',
    //   position: Cesium.Cartesian3.fromDegrees(118.05, 39.80),
    //   point: {
    //     pixelSize: 10,
    //     color: Cesium.Color.RED,
    //   }
    // });

    return () => {
      entitiesChangedListener();
      viewerInstance.destroy();
    };
  }, []);

  useEffect(() => {
    if (viewer.current) {
      viewer.current.scene.verticalExaggeration = inputValue;
      console.log('Vertical exaggeration updated:', inputValue);
    }
  }, [inputValue]);

  const addImageryLayer = (layerId, provider, name) => {
    if (provider && viewer.current) {
      const imageryLayer = viewer.current.imageryLayers.addImageryProvider(provider);
      imageryLayer.id = layerId;
      imageryLayer.name = name;
      setLayers((prevLayers) => [...prevLayers, { id: layerId, layer: imageryLayer }]);
    }
  }

  const removeImageryLayer = (layerId) => {
    if (viewer.current) {
      const layerToRemove = layers.find((layer) => layer.id === layerId);
      if (layerToRemove) {
        const removed = viewer.current.imageryLayers.remove(layerToRemove.layer);
        setLayers((prevLayers) => prevLayers.filter((layer) => layer.id !== layerId));
      }
    }
  }

  const add3DLayer = (layerId, tileset) => {
    if (tileset && viewer.current) {
      const layer = viewer.current.scene.primitives.add(tileset);
      layer.id = layerId;
      setLayers3D((prevLayers) => [...prevLayers, { id: layerId, layer: layer }]);
    }
  }

  const remove3DLayer = (layerId) => {
    if (viewer.current) {
      const layerToRemove = layers3D.find((layer) => layer.id === layerId);
      if (layerToRemove) {
        const removed = viewer.current.scene.primitives.remove(layerToRemove.layer);
        setLayers3D((prevLayers) => prevLayers.filter((layer) => layer.id !== layerId));
      }
    }
  }


  useEffect(() => {
    if (viewer.current && tiananmenValue) {
      const imageryProv =  new Cesium.TileMapServiceImageryProvider({
        url: 'http://localhost:8000/tiananmen/{z}/{x}/{y}.png',
      })

      addImageryLayer('layer_tam', imageryProv, '天安门');
    }
  }, [tiananmenValue]);

  useEffect(() => {
    if (viewer.current && LjzValue) {
      async function loadTileset() {
        try {
          console.log("1111yyyy")
            const tileset = await Cesium.Cesium3DTileset.fromUrl(
                'http://127.0.0.1:8000/shtower/tileset.json'
            );
            // console.log("Tileset loaded:", tileset);
            add3DLayer('layer_ljz', tileset);
            
            // viewer.current.zoomTo(tileset)
        } catch (error) {
            console.error("Failed to load tileset:", error);
        }
      }
      loadTileset()
    }
  }, [LjzValue]);

  async function loadTileset(url) {
    try {
      const tileset = await Cesium.Cesium3DTileset.fromUrl(url);
      add3DLayer('layer_ljz', tileset);
    } catch (error) {
      console.error("Failed to load tileset:", error);
    }
  }

  useEffect(() => {
    if (viewer.current && !tiananmenValue) {
      removeImageryLayer('layer_tam');
    }
  }, [tiananmenValue]);

  useEffect(() => {
    if (viewer.current && !LjzValue) {
      remove3DLayer('layer_ljz');
    }
  }, [LjzValue]);

  const runCode = () => {
    try {
      const cviewer = viewer.current;
      const userFunction = new Function("viewer", "Cesium", code);
      userFunction(cviewer, Cesium);
    } catch (error) {
      alert("代码运行错误：" + error.message);
    }
  };

  const dataload_obj = [
    {
      key: '1',
      label: '数据',
      children: dataload_tool
    },
    {
      key: '2',
      label: '分析量算',
      children: <List
      // header={<div>数据加载</div>}
      dataSource={measure_tool}
      renderItem={(item, index) => (
        <List.Item key={index}>
          <Typography.Text mark></Typography.Text> {item}
        </List.Item>
      )}
    />,
    },

    {
      key: '3',
      label: '标记工具',
      children: <List
      // header={<div>数据加载</div>}
      dataSource={markTool}
      renderItem={(item, index) => (
        <List.Item key={index}>
          <Typography.Text mark></Typography.Text> {item}
        </List.Item>
      )}
    />,
    },
    {
      key: '4',
      label: '场景',
      children:       <List
      dataSource={sceneTool}
      renderItem={(item, index) => (
        <List.Item key={index}>
          <Typography.Text mark></Typography.Text> {item}
        </List.Item>
      )}
    />,
    },
    {
      key: '5',
      label: '高级功能',
      children:       <List
      // header={<div>高级设置</div>}
      dataSource={highLevelTool}
      renderItem={(item, index) => (
        <List.Item key={index}>
          <Typography.Text mark></Typography.Text> {item}
        </List.Item>
      )}
    />,
    },
  ];

  const [selectedId, setSelectedId] = useState(null);
  const [sceneLists, setsceneLists] = useState([]);;

  const handleSelectChange = (e) => {
    setSelectedId(e.target.value);
  };

  useEffect(() => {
    getSceneList().then(res => {
      setsceneLists(res.data)
    })
  }, []);
  


  return (
    <Flex gap="middle" vertical>
    {contextHolder}
    <Splitter
    style={{
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      height: '100vh',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      
    }}
    >
    <Splitter.Panel collapsible defaultSize = '0%' size={eiditerSize}>
      <h3 style={{ margin: 0, padding: "10px", backgroundColor: "#f0f0f0" }}>代码编辑器</h3>
      <Editor
      height="90%"
      defaultLanguage="javascript"
      value={code}
      onChange={(value) => setCode(value || "")}
      theme="vs-dark"
      />
      <Button onClick={runCode}>运行代码</Button>
      <Modal title="场景导出" open={isModalOpen} onOk={handleExport} onCancel={handleCancel}>
      <Space direction="vertical" style={{ width: '100%' }}>
      <List
                bordered
                dataSource={sceneLists}
                renderItem={(item, index) => (
                  <List.Item key={index}>
                    <Radio
                      value={item.id}
                      checked={selectedId === item.id}
                      onChange={handleSelectChange}
                    >
                      {item.name}
                    </Radio>
                  </List.Item>
                )}
              />
        <Space>
          <p>场景名称:</p>
          <Input
            value={exportSenceName}
            onChange={handleexportSenceName}
          />
        </Space>

        <CheckboxGroup options={plainOptions} value={checkedList} onChange={onCheckedListChange} />
        </Space>
      </Modal>
      <Modal title="场景导入" open={isModalImportOpen} onOk={importScene} onCancel={handleImportCancel}>
                <List
                bordered
                dataSource={sceneLists}
                renderItem={(item, index) => (
                  <List.Item key={index}>
                    <Radio
                      value={item.id}
                      checked={selectedId === item.id}
                      onChange={handleSelectChange}
                    >
                      {item.name}
                    </Radio>
                  </List.Item>
                )}
              />
        {/* <CheckboxGroup options={plainOptions} value={checkedList} onChange={onCheckedListChange} /> */}
      
      </Modal>
      <Modal 
      title="位置跳转" open={isModalLocationOpen} onOk={handleLocationSubmit} onCancel={handleLocationCancel} 
      styles={{
        body: { 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px' // 设置一个合适的高度
        }
      }}>
      <Space>
    <Form onFinish={handleLocationSubmit}>
        <Form.Item label="经度">
          <Input
            name="longitude"
            value={coordinates.longitude}
            onChange={handleLocationChange}
          />
        </Form.Item>

        <Form.Item label="纬度">
          <Input
            name="latitude"
            value={coordinates.latitude}
            onChange={handleLocationChange}
          />
        </Form.Item>

        <Form.Item label="高度">
          <Input
            name="altitude"
            value={coordinates.altitude}
            onChange={handleLocationChange}
          />
        </Form.Item>
    </Form>
    </Space>
      </Modal>
      <Modal 
      title="添加数据" open={isModalImportDataOpen} onOk={handleImportDataSubmit} onCancel={handleImportDataCancel} 
      styles={{
        body: { 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px' // 设置一个合适的高度
        }
      }}>
      <Space>
    <Form onFinish={handleImportDataSubmit}>
        <Form.Item label="数据类型">
        <Select
          style={{ width: 120 }}
          value={importDatacoordinates.dataType}
          onChange={handleImportDataChangeDataType}
          options={[
            { value: 'terrain', label: '地形' },
            { value: 'tiles', label: '3D Tiles' },
            { value: 'WMS', label: 'TMS' },
          ]}
        />
        </Form.Item>

        <Form.Item label="数据名称">
          <Input
            name="dataName"
            value={importDatacoordinates.dataName}
            onChange={handleImportDataChange}
          />
        </Form.Item>

        <Form.Item label="数据地址">
          <Input
            name="dataUrl"
            value={importDatacoordinates.dataUrl}
            onChange={handleImportDataChange}
          />
        </Form.Item>
        <Form.Item label="经度">
          <Input
            name="longitude"
            value={importDatacoordinates.longitude}
            onChange={handleImportDataChange}
          />
        </Form.Item>

        <Form.Item label="纬度">
          <Input
            name="latitude"
            value={importDatacoordinates.latitude}
            onChange={handleImportDataChange}
          />
        </Form.Item>

        <Form.Item label="高度">
          <Input
            name="altitude"
            value={importDatacoordinates.altitude}
            onChange={handleImportDataChange}
          />
        </Form.Item>
    </Form>
    </Space>
      </Modal>
    </Splitter.Panel>
    <Splitter.Panel collapsible min="20%">
      <div style={{width: '100%', height: '100vh', position: 'relative',}}>
    <div style={{ position: 'relative', height: '100vh' }}>
      <div
        id="cesiumContainer"
        ref={viewerRef}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      ></div>
    </div>
    </div>

      <div onMouseEnter={showDrawer}> <FloatButton shape="square" type="primary"style={{insetInlineEnd: 24,}}icon={<MenuUnfoldOutlined />}/></div>
      <Drawer
        title="工具箱"
        placement="left"
        onClose={onClose}
        open={visible}
        onMouseLeave={onClose}
      >
      <Collapse items={dataload_obj} defaultActiveKey={['1', '2', '3']}/>
      </Drawer>
      
    </Splitter.Panel>
  </Splitter>
  </Flex>
  );
};

export default ViewerPage;


