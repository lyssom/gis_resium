import { useEffect, useState, useRef, use } from "react";
import * as Cesium from "cesium";
import { Col, InputNumber, Row, Slider, Space } from 'antd';

import { Editor } from "@monaco-editor/react";
import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Drawer, FloatButton, List, Typography, Flex, Splitter, Modal, Checkbox, Switch, Divider, Collapse } from 'antd';
import { AimOutlined, DeleteOutlined } from '@ant-design/icons';
import "./index.css"
import excavateTerrain from "./excavateTerrain.js"

const ViewerPage = () => {
  const [code, setCode] = useState(`// 编辑代码
  `);
  const [eiditerSize, setEiditerSize] = useState('0%');
  const [inputValue, setInputValue] = useState(1);
  const viewerRef = useRef(null); 
  const viewer = useRef(null); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [divPosition, setDivPosition] = useState('0px');

  const [tiananmenValue, setTiananmenValue] = useState(false);
  const [layers, setLayers] = useState([])

  const CheckboxGroup = Checkbox.Group
  const plainOptions = ['代码', '实体'];
  const defaultCheckedList = ['代码', '实体'];

  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const [allEntities, setAllEntities] = useState([]);

  const [entitiesList, setEntitiesList] = useState([]);
  const [entities, setEntities] = useState([]);
  const checkAll = plainOptions.length === checkedList.length;
  const indeterminate = checkedList.length > 0 && checkedList.length < plainOptions.length;

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

  const handleDeleteEntitiy = (id) => { // 删除实体 
    viewer.current.entities.removeById(id);
  };

  console.log('entities:', entities);
  console.log(666);
    const dataload_tool = [
      <div>
        <Divider>图层</Divider>
        <div class="container">
          <div><Checkbox defaultChecked={false} onChange={handleTiananmen}/><Divider type="vertical"/>天安门</div>
          <div><Button type="default" size="small" icon={<AimOutlined />} onClick={fly2Tiananmen}></Button></div>
        </div>
        <Divider>实体</Divider>
        <List
      dataSource={entities}
      renderItem={(item, index) => (
        <List.Item>
          <Typography.Text mark></Typography.Text>  {item._name ? item._name : 'layer_' + index}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteEntitiy(item.id)} // 删除按钮点击事件
            style={{ marginLeft: 'auto' }} // 确保按钮在右侧
          />
        </List.Item>
      )}
    />
      </div>
      
      // <Button type="primary" icon={<AimOutlined />} onClick={fly2Tiananmen}></Button>,
      // <Button type="primary" onClick={handleTiles3D}>3Dtiles</Button>,
      // <Button type="primary" onClick={handleTif}>地势Tif</Button>,
      // <Button type="primary" onClick={handleTer}>高光谱融合图</Button>,
    ];

    const addMarkPoint = () => {
      var handler = new Cesium.ScreenSpaceEventHandler(viewer.current.scene.canvas);
      let eventType= Cesium.ScreenSpaceEventType.LEFT_CLICK
      function addPoint(screenPosition) {
          console.log(112)
          const { scene } = viewer.current;
          const ellipsoid = scene.globe.ellipsoid;
          const cartesian = viewer.current.camera.pickEllipsoid(screenPosition, ellipsoid);
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
          viewer.current.entities.add(point)
          console.log(viewer.current.entities._entities)
      }

      handler.setInputAction(event=>{
          // console.log(event.position);
          addPoint(event.position)
      }, eventType);
    }

    const markTool = [
      <Button type="primary" 
      // icon={<AimOutlined />} 
      onClick={addMarkPoint}
      >标记点</Button>,
    ];

    const initTP = async() => {
      const wterrainProvider = await Cesium.createWorldTerrainAsync()
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
  
    const measure_tool = [
      // <Button type="primary" onClick={handleMeasure}>空间距离</Button>,
      // <Button type="primary" onClick={handlegroundMeasure}>地表距离</Button>,
      <Button type="primary" onClick={handlExcavate}>地形开挖</Button>,
    ];
  
    const highLevelTool = [
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
    </Space>
    ];


  Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI3ZjQ5ZGUzNC1jNWYwLTQ1ZTMtYmNjYS05YTY4ZTVmN2I2MDkiLCJpZCI6MTE3MTM4LCJpYXQiOjE2NzY0NDUyODB9.ZaNSBIfc1sGLhQd_xqhiSsc0yr8oS0wt1hAo9gbke6M";

  const handleCancel = () => {
    setIsModalOpen(false);
  }

  const handleExport = () => {
    console.log('export')
    console.log(checkedList)
    const allEntities = viewer.entities.values;
    console.log(allEntities); // 输出所有实体
    console.log(code);
  }

  const showModal = () => {
    setIsModalOpen(true);
  };

  useEffect(() => {
    if (entities.length > 0) {
      console.log("Entities have been updated:", entities);
      // 你可以在这里触发任何必要的更新或刷新操作
      // 例如更新其他组件状态、重新渲染等
    }
  }, [entities]); // 监听entities的变化

  useEffect(() => {
    // 创建 Viewer 实例
    const viewerInstance = new Cesium.Viewer(viewerRef.current, {
        // terrain: new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl(
        //   // "http://data.mars3d.cn/terrain/"
        //   "http://localhost:8000/tiles"
        //   ))
    });
    
    // console.log('terrainProvider:', viewerInstance.scene.terrainProvider);
    viewer.current = viewerInstance;
      // 获取所有实体并存储在state中
    const updateEntities = () => {
      setEntities(viewerInstance.entities.values);
    };
    const entitiesChangedListener = viewerInstance.entities.collectionChanged.addEventListener(updateEntities);
    // viewerInstance.scene.verticalExaggeration = inputValue;
    
    viewerInstance.entities.add({
      name: '丰润区中心点',
      position: Cesium.Cartesian3.fromDegrees(118.05, 39.80),
      point: {
        pixelSize: 10,
        color: Cesium.Color.RED,
      }
    });

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

  const addImageryLayer = (layerId, provider) => {
    if (provider && viewer.current) {
      const imageryLayer = viewer.current.imageryLayers.addImageryProvider(provider);
      imageryLayer.id = layerId;
      setLayers((prevLayers) => [...prevLayers, { id: 'layer_tam', layer: imageryLayer }]);
    }
  }

  const removeImageryLayer = (layerId) => {
    if (viewer.current) {
      console.log(viewer.current.imageryLayers)
      const layerToRemove = layers.find((layer) => layer.id === layerId);
      if (layerToRemove) {
        const removed = viewer.current.imageryLayers.remove(layerToRemove.layer);
        setLayers((prevLayers) => prevLayers.filter((layer) => layer.id !== layerId));
      }
    }
  }


  useEffect(() => {
    if (viewer.current && tiananmenValue) {

      const rectangle = Cesium.Rectangle.fromDegrees(
        116.3836, // west
        39.9055,  // south
        116.39, // east
        39.91
      );
      const imageryProv =  new Cesium.TileMapServiceImageryProvider({
        url: 'http://localhost:8000/tiananmen/{z}/{x}/{y}.png',
        tilingScheme: new Cesium.WebMercatorTilingScheme(),
        fileExtension: "png",
        rectangle:rectangle,
        minimumLevel: 16,
        // maximumLevel: 22,
      })

      addImageryLayer('layer_tam', imageryProv);
    }
  }, [tiananmenValue]);

  useEffect(() => {
    if (viewer.current && !tiananmenValue) {
      removeImageryLayer('layer_tam');
    }
  }, [tiananmenValue]);

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
      label: '图层',
      children: <List
      // header={<div>数据加载</div>}
      dataSource={dataload_tool}
      renderItem={(item) => (
        <List.Item>
          <Typography.Text mark></Typography.Text> {item}
        </List.Item>
      )}
    />,
    },
    {
      key: '2',
      label: '分析量算',
      children: <List
      // header={<div>数据加载</div>}
      dataSource={measure_tool}
      renderItem={(item) => (
        <List.Item>
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
      renderItem={(item) => (
        <List.Item>
          <Typography.Text mark></Typography.Text> {item}
        </List.Item>
      )}
    />,
    },
    {
      key: '4',
      label: '高级设置',
      children:       <List
      // header={<div>高级设置</div>}
      dataSource={highLevelTool}
      renderItem={(item) => (
        <List.Item>
          <Typography.Text mark></Typography.Text> {item}
        </List.Item>
      )}
    />,
    },
  ];


  return (
    <Flex gap="middle" vertical>
    <Splitter
    style={{
      boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
      height: '100vh',
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
      <Button type="primary" onClick={showModal}>导出场景</Button>
      <Modal title="Basic Modal" open={isModalOpen} onOk={handleExport} onCancel={handleCancel}>
        <CheckboxGroup options={plainOptions} value={checkedList} onChange={onCheckedListChange} />
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


