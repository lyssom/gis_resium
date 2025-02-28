import { useEffect, useState, useRef, use } from "react";
import * as Cesium from "cesium";
import { Col, InputNumber, Row, Slider, Space } from 'antd';

import { Editor,loader  } from "@monaco-editor/react";
import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Drawer, FloatButton, List, Typography, Flex, Splitter, Modal, Checkbox, Switch, Divider, Collapse, Radio, Form, Input, Select } from 'antd';
import { AimOutlined, DeleteOutlined, LineOutlined, PlusSquareOutlined, EnvironmentOutlined, DownloadOutlined } from '@ant-design/icons';
import "./index.css"
import excavateTerrain from "./excavateTerrain.js"
import {load, clears } from "./line_of_sight.js"
import {CesiumWind, WindLayer} from "./cesium-wind.js"
import { message } from 'antd';
import CesiumPlot from 'cesium-plot-js';


import axios from '../../api/axios'
import {measureLineSpace, measureGroundDistance, measureAreaSpace, altitude} from "./measureTool.js"


import {getSceneDetail, saveSceneDetail, getSceneList, getImageDatas, saveImageData, getExcavateResource, getCzmlData} from '../../api/index.js'

const ViewerPage = () => {
  loader.config({
    paths: {
      vs: 'http://127.0.0.1:8000/static/vs',
    },
  });
  const [code, setCode] = useState(`// 编辑代码
  `);
  const [eiditerSize, setEiditerSize] = useState('0%');
  const [inputValue, setInputValue] = useState(1);
  const viewerRef = useRef(null); 
  const viewer = useRef(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalImportOpen, setIsModalImportOpen] = useState(false);
  const [mr, setmr] = useState([]);
  const [isModalExcavateOpen, setIsModalExcavateOpen] = useState(false);
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
  const [photoList, setPhotoList] = useState({})
  const [czmlList, setCzmlList] = useState({})
  const [selectedTerrainId, setSelectedTerrainId] = useState(null)
  const [exportSenceName, setExportSenceName] = useState('')

  const [excavateHight, setExcavateHight] = useState(0)

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

  const handleExcavateHightChange = (e) => {
    setExcavateHight(e.target.value)
  }

  const handleImportDataChange = (e) => {
    setimportDataCoordinates({
      ...importDatacoordinates,
      [e.target.name]: e.target.value
    });
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

  const handleDownloadEntitiy = (id) => { // 删除实体 
    // viewer.current.entities.removeById(id);
    // console.log(66666666)
    let entity = viewer.current.entities.getById(id);

    let geojson = {
      type: "FeatureCollection",
      features: []
    };

    console.log(entity)
    let feature = {
      type: "Feature",
      properties: {
        name: entity.name || "Unknown"
      },
      geometry: null
    };
    if (entity.position) {
      let cartographic = Cesium.Cartographic.fromCartesian(entity.position.getValue(Cesium.JulianDate.now()));
      let lon = Cesium.Math.toDegrees(cartographic.longitude);
      let lat = Cesium.Math.toDegrees(cartographic.latitude);
      feature.geometry = {
          type: "Point",
          coordinates: [lon, lat]
      };
    } else if (entity.polygon) {
      let hierarchy = entity.polygon.hierarchy.getValue(Cesium.JulianDate.now());
      let coordinates = hierarchy.positions.map(pos => {
          let cartographic = Cesium.Cartographic.fromCartesian(pos);
          return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
      });
      coordinates.push(coordinates[0]); // 关闭多边形
      feature.geometry = {
          type: "Polygon",
          coordinates: [coordinates]
      };
    } else if (entity.polyline) {
      let positions = entity.polyline.positions.getValue(Cesium.JulianDate.now());
      let coordinates = positions.map(pos => {
          let cartographic = Cesium.Cartographic.fromCartesian(pos);
          return [Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude)];
      });
      feature.geometry = {
          type: "LineString",
          coordinates: coordinates
      };
    }

    if (feature.geometry) {
        geojson.features.push(feature);
    }
    console.log(geojson)
    console.log(7778)

    let blob = new Blob([JSON.stringify(geojson)], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "entities.geojson";
    a.click();
  };

  useEffect(() => {
    getImageDatas().then(res => {
      const { data } = res;
      setTerrainList(data.terrain_data);
      setTilesList(data.tiles_data);
      setWmsList(data.wms_data);
      setPhotoList(data.photo_data);
      setCzmlList(data.czml_data);
    })
  }, []); // 监听entities的变化

  const handleSelectTerrainChange = (e) => {
    setSelectedTerrainId(e.target.value.id);
    let tpurl
    if (e.target.value.data_name=='全局地形') {
      initTP();
    } else {
      terrainList.forEach(item => {
        if (item.id == e.target.value.id) {
          tpurl = item.data_url;
        }
      })
      initCustomTP(tpurl);
    }
  }

  const fly2Loc = (lon, lat, alt) => {
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

  const loadWMS = (tile) => {
    const layerRes = layers.find((layer) => layer.id === tile.id);
    if (layerRes) {
      removeImageryLayer(tile.id);
    } else {
      const imageryProv =  new Cesium.TileMapServiceImageryProvider({
        url: tile.data_url,
      })
  
      addImageryLayer(tile.id, imageryProv, tile.data_name);
    }
  }

  const loadPhoto = (tile) => {
      const ent = new Cesium.Entity({
        position: Cesium.Cartesian3.fromDegrees(tile.lon, tile.lat, tile.height),
        billboard: {
            image: tile.data_url,
            scale: 1,
            width: 32,
            height: 32,
        },
    });
    viewer.current.entities.add(ent)
  }

  const loadCzml = (tile) => {
    console.log(111)
    var czmlDataSource = new Cesium.CzmlDataSource();
    viewer.current.dataSources.add(czmlDataSource);
    console.log(tile.data_url)


    let czmldata = new Cesium.CzmlDataSource.load('http://127.0.0.1:8000/ter_analysis/point.czml');
    viewer.current.dataSources.add(czmldata)
    viewer.current.clock.shouldAnimate = true;
    // getCzmlData(tile.data_url).then(res => {
    //   const { data } = res;
    //   czmlDataSource.load(data);
    //   console.log(data)

    //   czmlDataSource.load(data).then(function() {
    //     console.log('CZML Data Loaded');
    //   })
      
    // })
      
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
        <Checkbox defaultChecked={false} onChange={() =>loadTileset(item)}/><Divider type="vertical"/>
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
        <Checkbox defaultChecked={false} onChange={() =>loadWMS(item)}/><Divider type="vertical"/>
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

       {photoList.length > 0 && (<List
        dataSource={photoList}
        split={false}
        renderItem={(item, index) => (
          <div className="container">
        <List.Item style={{ padding: 0 }} key={index}>
        <Checkbox defaultChecked={false} onChange={() =>loadPhoto(item)}/><Divider type="vertical"/>
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
        {czmlList.length > 0 && (<List
        dataSource={czmlList}
        split={false}
        renderItem={(item, index) => (
          <div className="container">
        <List.Item style={{ padding: 0 }} key={index}>
        <Checkbox defaultChecked={false} onChange={() =>loadCzml(item)}/><Divider type="vertical"/>
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
          
          handler.removeInputAction(eventType);
      }, eventType);
    }

    const addTailShape = () => {
      new CesiumPlot.FineArrow(Cesium, viewer.current);
    }


    const getwindData = () => {
      return axios.request({
          url: '/static/2024122600.json',
          method: 'get',
      })
  }

    const createWind = () => {
      
      const windOptions = {
        colorScale: [
            'rgb(36,104, 180)',
            'rgb(60,157, 194)',
            'rgb(128,205,193 )',
            'rgb(151,218,168 )',
            'rgb(198,231,181)',
            'rgb(238,247,217)',
            'rgb(255,238,159)',
            'rgb(252,217,125)',
            'rgb(255,182,100)',
            'rgb(252,150,75)',
            'rgb(250,112,52)',
            'rgb(245,64,32)',
            'rgb(237,45,28)',
            'rgb(220,24,32)',
            'rgb(180,0,35)',
        ],
        frameRate: 16,
        maxAge: 60,
        globalAlpha: 0.9,
        velocityScale: 1 / 30,
        paths: 2000,
        minVelocity : 35,
        maxVelocity : 38,
    };
    let windLayer;

    getwindData().then(res => {
      // setsceneLists(res.data)
      windLayer = new WindLayer(res.data, { windOptions });
      windLayer.addTo(viewer.current);
    })

    // windLayer = new CesiumWind.WindLayer(res, { windOptions });
    // windLayer.addTo(viewer);
    // fetch('./2024122900.json')
    //     .then(res => res.json())
    //     .then(res => {
    //         windLayer = new WindLayer(res, { windOptions });
    //         windLayer.addTo(viewer.current);
    //         // windLayer.remove();
    //     });

    // console.log(666)
    }

    const addCircleShape = () => {
      new CesiumPlot.Circle(Cesium, viewer.current);
    }

    const addReactangleShape = () => {
      new CesiumPlot.Reactangle(Cesium, viewer.current);
    }

    const addTriangleShape = () => {
      new CesiumPlot.Triangle(Cesium, viewer.current);
    }

    const addLuneShape = () => {
      new CesiumPlot.Lune(Cesium, viewer.current);
    }

    const addEllipseShape = () => {
      new CesiumPlot.Ellipse(Cesium, viewer.current);
    }

    const addDoubleArrowShape = () => {
      new CesiumPlot.DoubleArrow(Cesium, viewer.current);
    }

    const diffTer = () => {  
      
      const url2 = "http://127.0.0.1:8000/static/jg"
      const url1 = "http://127.0.0.1:8000/static/flat_jg"
      
      initCustomTP(url1)
      const longitude1 = 130.9844444984249
      const latitude1 = 45.26029255146479
      const longitude2 = 130.97337761004155
      const latitude2 = 45.25578210040948
      
      const lonDiff = longitude1 - longitude2;
      const latDiff = latitude1 - latitude2;
        
        // 生成100个均匀分布的点
        const numPoints = 100;
        const points1 = [];
        const points2 = [];

        for (let i = 0; i < numPoints; i++) {
            // const lon = positions[0].longitude + t * lonDiff;
            // const lat = positions[0].latitude + t * latDiff;
            const lon = longitude1 + (lonDiff * i) / (numPoints - 1);
            const lat = latitude1 + (latDiff * i) / (numPoints - 1);
            console.log(111222)
            console.log(lon, lat)
            console.log(111)
            
            points1.push(Cesium.Cartographic.fromDegrees(lon, lat));
            points2.push(Cesium.Cartographic.fromDegrees(lon, lat));
        }
        
        // 打印生成的点
        console.log(points1)
    Cesium.CesiumTerrainProvider.fromUrl(url1).then(t1 => {
      console.log("t1 Ready:", t1);
      Cesium.sampleTerrain(t1, 14, points1).then(up1 => {
        console.log("up1:", up1);
        Cesium.CesiumTerrainProvider.fromUrl(url2).then(t2 => {
          console.log("t2 Ready:", t2);
          Cesium.sampleTerrain(t2, 14, points2).then(up2 => {
            console.log("up2:", up2);

            const heightDiffs = up1.map((pos, index) => {
              let height1 = pos?.height ?? 0;
              const height2 = up2[index]?.height ?? 0;
              console.log(height1, height2)
              return height1 - height2;
            });
            
            for (let i = 0; i < points1.length; i++) {
              const cartographic = points1[i];
              viewer.current.entities.add({
                polyline: {
                  positions: [
                    Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, up1[i].height),
                    Cesium.Cartesian3.fromRadians(cartographic.longitude, cartographic.latitude, up2[i].height),
                  ],
                  width: 2,
                  material: heightDiffs[i] > 0 ? Cesium.Color.RED : Cesium.Color.BLUE,
                },
            });
        }
        console.log("Height Differences:", heightDiffs);
          })
        })
      })
    })
    }
      
    
    const perspective = () => {
      initTP();
      const position = Cesium.Cartesian3.fromRadians(
        -2.0862979473351286,
        0.6586620013036164,
        1400.0,
      );
    
      const entity = viewer.current.entities.add({
        position: position,
        box: {
          dimensions: new Cesium.Cartesian3(1400.0, 1400.0, 2800.0),
          material: Cesium.Color.WHITE.withAlpha(0.3),
          outline: true,
          outlineColor: Cesium.Color.WHITE,
        },
      });

      const position1 = Cesium.Cartesian3.fromDegrees(-119.53425816053938, 37.74516619631135, 2645.2503255914385);
      const position2 = Cesium.Cartesian3.fromDegrees(-119.53809192430263, 37.73184280293752, 2733.2710411652242);
      const position3 = Cesium.Cartesian3.fromDegrees(-119.54612365179732, 37.7386414966634, 2707.024549426925);
      const position_end = Cesium.Cartesian3.fromDegrees(-119.53576035731167, 37.74110180202345, 1500);
      const positions = [position1, position2, position3];

      positions.forEach((position) => {
        viewer.current.entities.add({
            polyline: {
                positions: [position, position_end],
                width: 2,  // 线条宽度
                material: Cesium.Color.RED // 线条颜色
            }
        });
    });

      viewer.current.scene.globe.depthTestAgainstTerrain = true;
      viewer.current.scene.globe.clippingPlanes = new Cesium.ClippingPlaneCollection({
        modelMatrix: entity.computeModelMatrix(Cesium.JulianDate.now()),
        planes: [
          new Cesium.ClippingPlane(new Cesium.Cartesian3(1.0, 0.0, 0.0), -700.0),
          new Cesium.ClippingPlane(new Cesium.Cartesian3(-1.0, 0.0, 0.0), -700.0),
          new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, 1.0, 0.0), -700.0),
          new Cesium.ClippingPlane(new Cesium.Cartesian3(0.0, -1.0, 0.0), -700.0),
        ],
        edgeWidth: 1.0,
        edgeColor: Cesium.Color.WHITE,
        enabled: true,
      });
      viewer.current.scene.globe.backFaceCulling = true;
      viewer.current.scene.globe.showSkirts = true;
    
      viewer.current.trackedEntity = entity;

    }

    const createCylinder = () => {
      if (viewer.current) {
        var startPoint, endPoint;
        var handler = new Cesium.ScreenSpaceEventHandler(viewer.current.canvas);
        handler.setInputAction(function (click) {
            var windowPosition = click.position;
            var ray = viewer.current.camera.getPickRay(windowPosition);
            var cartesian = viewer.current.scene.globe.pick(ray, viewer.current.scene);

            if (Cesium.defined(cartesian)) {
                if (!startPoint) {
                    startPoint = cartesian;
                } else {
                    endPoint = cartesian;
                    const midpoint = Cesium.Cartesian3.midpoint(startPoint, endPoint, new Cesium.Cartesian3());
                    const rr = Cesium.Cartesian3.distance(startPoint, endPoint);
                    const topRadius = rr ;  // 固定的顶部半径
                    const bottomRadius = rr;  // 固定的底部半径
                    console.log("Midpoint:", midpoint);
                    console.log("Distance:", Cesium.Cartesian3.distance(startPoint, endPoint));
                    const cylinderEntity = new Cesium.Entity({
                        position: midpoint,  // 设置圆柱体的中心位置
                        cylinder: {
                            material: Cesium.Color.ORCHID,
                            length: 100000,  // 设置圆柱体的高度（两点间的距离）
                            topRadius: topRadius,  // 设置圆柱体的顶部半径
                            bottomRadius: bottomRadius,  // 设置圆柱体的底部半径
                            outline: true,
                            outlineColor: Cesium.Color.LAWNGREEN
                        }
                    });
        
                    viewer.current.entities.add(cylinderEntity);
                    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
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



    const markTool = [
      <Space wrap="false" align="baseline">
      <Button
      onClick={() =>addEntity('point')}
      >点</Button>
      <Button
      onClick={() =>addEntity('billboard')}
      >标记</Button>
      <Button
      onClick={() =>addTailShape()}
      >燕尾图</Button>
      <Button
      onClick={() =>addCircleShape()}
      >圆形</Button>
      <Button
      onClick={() =>addReactangleShape()}
      >矩形</Button>
      <Button
      onClick={() =>addTriangleShape()}
      >三角形</Button>
      <Button
      onClick={() =>addLuneShape()}
      >半月面</Button>
      <Button
      onClick={() =>addEllipseShape()}
      >椭圆</Button>
      <Button
      onClick={() =>addDoubleArrowShape()}
      >双箭头</Button>
      <Button
      onClick={() =>createCylinder()}
      >圆柱体</Button>
      </Space>
    ];

    const initTP = async() => {
      // const wterrainProvider = await Cesium.createWorldTerrainAsync()
      const wterrainProvider = await Cesium.CesiumTerrainProvider.fromUrl("http:/127.0.0.1:8000/all_tiles/")
      viewer.current.terrainProvider = wterrainProvider;
    }

    const initCustomTP = async(url) => {
      const wterrainProvider = await Cesium.CesiumTerrainProvider.fromUrl(url)
      viewer.current.terrainProvider = wterrainProvider;
    }


    const handlExcavate = () => {
      viewer.current.scene.globe.depthTestAgainstTerrain = true;
      // initTP();

    const scene = viewer.current.scene;
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

    let firstClickPosition = null;
    let rectangleEntity = null;

    handler.setInputAction((click) => {
        const ray = viewer.current.camera.getPickRay(click.position);
        const position = viewer.current.scene.globe.pick(ray, scene);

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

                const west = rectangleCoordinates.west;
                const south = rectangleCoordinates.south;
                const east = rectangleCoordinates.east;
                const north = rectangleCoordinates.north;
                console.log(west, south, east, north);

                const southwest = new Cesium.Cartographic(west, south);
                const southeast = new Cesium.Cartographic(east, south);
                const northeast = new Cesium.Cartographic(east, north);
                const northwest = new Cesium.Cartographic(west, north);
                const southwestCartesian = viewer.current.scene.globe.ellipsoid.cartographicToCartesian(southwest);
                const southeastCartesian = viewer.current.scene.globe.ellipsoid.cartographicToCartesian(southeast);
                const northeastCartesian = viewer.current.scene.globe.ellipsoid.cartographicToCartesian(northeast);
                const northwestCartesian = viewer.current.scene.globe.ellipsoid.cartographicToCartesian(northwest);
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
                setmr(mr)
                setIsModalExcavateOpen(true);
                handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);

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

                if (!startPoint) {
                    startPoint = cartesian;
                } else {
                    endPoint = cartesian;
                    load(viewer.current, startPoint, endPoint, messageApi);
                    handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
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

    const handleAreaMeasure = () => {
      measureAreaSpace(viewer.current);
    }

    const handlaltitudeMeasure = () => {
      altitude(viewer.current);
    }


    const measure_tool = [
      <Space>
      <Button onClick={handleMeasure}>空间距离</Button>
      <Button onClick={handlegroundMeasure}>地表距离</Button>
      <Button onClick={handleAreaMeasure}>地表面积</Button>
      </Space>,
      <Space>
        <Button onClick={handlExcavate}>地形开挖</Button>
        <Button onClick={handlelineofsight}>通视/遮蔽</Button>
      </Space>
      
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
                image: 'http://127.0.0.1:8000/static/mark_b.png',
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
  }}


    const importScene = () => {
      getSceneDetail({'id': selectedId}).then(res => {

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
      const lon = parseFloat(longitude);
      const lat = parseFloat(latitude);
      const alt = parseFloat(altitude);

      const jsonOutput = JSON.stringify(
        {"data_type": dataType, "data_name":dataName, "data_url":dataUrl, "lon":lon, "lat":lat, 'alt': alt},
        null, 2);

      saveImageData({'data': JSON.parse(jsonOutput)}).then(res => {
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
        setPhotoList(data.photo_data);
        setCzmlList(data.czml_data);
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
      <Row><Button onClick={showLocationModal}>位置跳转</Button></Row>
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
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadEntitiy(item.id)} // 删除按钮点击事件
            style={{ marginLeft: 'auto' }} // 确保按钮在右侧
          />
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
        <Row><Button onClick={showImportModal}>导入场景</Button></Row>
        <Row><Button onClick={showModal}>导出场景</Button></Row>
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

  const handleExcavateCancel = () => {
    setIsModalExcavateOpen(false);
  }

  const handlestartExcavate = () => {
    // setstartExcavate(true);
    console.log(1222)
    console.log(excavateHight)
    console.log(122233)
    console.log(mr)
    handleExcavateCancel()

    const centerCartesian = new Cesium.Cartesian3(
      (mr[0].x + mr[1].x + mr[2].x + mr[3].x) / 4,
      (mr[0].y + mr[1].y + mr[2].y + mr[3].y) / 4,
      (mr[0].z + mr[1].z + mr[2].z + mr[3].z) / 4
    );

    const centerCartographic = viewer.current.scene.globe.ellipsoid.cartesianToCartographic(centerCartesian);
    const centerLongitude = Cesium.Math.toDegrees(centerCartographic.longitude); // 经度
    const centerLatitude = Cesium.Math.toDegrees(centerCartographic.latitude); // 纬度


    getExcavateResource({'hight': excavateHight, 'lon': centerLongitude, 'lat': centerLatitude}).then(res => {
      const { data } = res;
      console.log(data)
      new excavateTerrain(viewer.current, {
        positions: mr,
        height: excavateHight,
        bottom: "/ter_analysis/" + data.bottom,
        side: "/ter_analysis/" + data.side
      })
    })

    setExcavateHight(0)
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
    const imageriesData = [];

    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      imageriesData.push({
        name: layer.layer.name,
        url:layer.layer.imageryProvider.url,
      });
    }

    const jsonOutput = JSON.stringify(
      {"imagery":imageriesData, "entities":entitiesData},
      null, 2);
    saveSceneDetail({'data': JSON.parse(jsonOutput), "code": code, "name": exportSenceName, "id": exportId}).then(res => {
    })

    getSceneList().then(res => {
      setsceneLists(res.data)
    })

    setExportSenceName("")
  }

  useEffect(() => {
    if (entities.length > 0) {
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


    var baseLayer = viewerInstance.imageryLayers.get(0);
    viewerInstance.imageryLayers.remove(baseLayer);
    var xyz = new Cesium.TileMapServiceImageryProvider({
      "url": 'http://127.0.0.1:8000/base_map/{z}/{x}/{y}.png'
    })
    viewerInstance.imageryLayers.addImageryProvider(xyz)
    
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
            const tileset = await Cesium.Cesium3DTileset.fromUrl(
                'http://127.0.0.1:8000/shtower/tileset.json'
            );
            add3DLayer('layer_ljz', tileset);
        } catch (error) {
            console.error("Failed to load tileset:", error);
        }
      }
      loadTileset()
    }
  }, [LjzValue]);

  async function loadTileset(tile) {
    const layerRes = layers3D.find((layer) => layer.id === tile.id);
    if (layerRes) {
      remove3DLayer(tile.id);
    }
    else{
      try {
        console.log(111112)
        initTP();

        const tileset = await Cesium.Cesium3DTileset.fromUrl(tile.data_url);
        const boundingSphere = tileset.boundingSphere;
        const cartographic = Cesium.Cartographic.fromCartesian(boundingSphere.center);

        // 采样地形高度
        const terrainProvider = viewer.current.terrainProvider;
        console.log(terrainProvider)
        Cesium.sampleTerrainMostDetailed(terrainProvider, [cartographic]).then((updatedCartographics) => {
            const terrainHeight = updatedCartographics[0].height;

            const surface = Cesium.Cartesian3.fromRadians(
                cartographic.longitude,
                cartographic.latitude,
                terrainHeight
            );

            const offset = Cesium.Cartesian3.subtract(
                boundingSphere.center,
                surface,
                new Cesium.Cartesian3()
            );

            tileset.modelMatrix = Cesium.Matrix4.fromTranslation(offset);
        });
        add3DLayer(tile.id, tileset);
      } catch (error) {
        console.error("Failed to load tileset:", error);
      }
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
      const userFunction = new Function("viewer", "Cesium", "axios", "WindLayer", code);
      userFunction(cviewer, Cesium, axios, WindLayer);
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
      label: '标记建模',
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
      <Button onClick={runCode} type="perimary">运行代码</Button>
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

      <Modal title="挖掘配置" open={isModalExcavateOpen} onOk={handlestartExcavate} onCancel={handleExcavateCancel}>
        <Space>
          <p>挖掘深度</p>
          <Input
            name="excavate_hight"
            value={excavateHight}
            onChange={handleExcavateHightChange}
          />  
        </Space>
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
            { value: 'photo', label: '图片' },
            { value: 'czml', label: 'CZML' },
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
        className="fullSize"
        ref={viewerRef}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      ></div>
      <div id="toolbar">多 源 数 据 融 合</div>
    </div>
    </div>

      <div onClick={showDrawer}> <FloatButton shape="square" type="primary"style={{insetInlineEnd: 24,}}icon={<MenuUnfoldOutlined />}/></div>
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


