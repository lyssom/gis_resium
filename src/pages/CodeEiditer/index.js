import React, { useEffect, useRef, useState } from "react";
import * as Cesium from "cesium";
import { Viewer,Entity,ImageryLayer } from "resium";
import { Editor } from "@monaco-editor/react";
import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Drawer, FloatButton, List, Typography, Flex, Splitter, Modal, Checkbox } from 'antd';


const Desc = (props) => (
  <Flex
    justify="center"
    align="center"
    style={{
      height: '100%',
    }}
  >
    <Typography.Title
      type="secondary"
      level={5}
      style={{
        whiteSpace: 'nowrap',
      }}
    >
      {props.text}
    </Typography.Title>
  </Flex>
);


const CesiumApp = () => {
  let viewer
  // const viewerRef = useRef(null);
  const [code, setCode] = useState(`// 编辑代码
  `);
  const [visible, setVisible] = useState(false);
  const [divPosition, setDivPosition] = useState('0px');
  const [eiditerSize, setEiditerSize] = useState('0%');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const CheckboxGroup = Checkbox.Group
  const plainOptions = ['代码', '实体'];
  const defaultCheckedList = ['代码', '实体'];

  const [checkedList, setCheckedList] = useState(defaultCheckedList);
  const checkAll = plainOptions.length === checkedList.length;
  const indeterminate = checkedList.length > 0 && checkedList.length < plainOptions.length;

  const onChange = (list) => {
    setCheckedList(list);
  };
  const onCheckAllChange = (e) => {
    setCheckedList(e.target.checked ? plainOptions : []);
  };

  const showDrawer = () => {
    setVisible(true);
    setDivPosition('250px');
  };

  const onClose = () => {
    setVisible(false);
    setDivPosition('0px');
  };

  const showEdt = () => {
    setEiditerSize('50%');
  };
  
  const runCode = () => {
    try {
      // const viewer = viewerRef.current.cesiumElement;
      const userFunction = new Function("viewer", "Cesium", code);
      userFunction(viewer, Cesium);
    } catch (error) {
      alert("代码运行错误：" + error.message);
    }
  };

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

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

  const dataload_tool = [
    // <Button type="primary" onClick={handleTiles3D}>3Dtiles</Button>,
    // <Button type="primary" onClick={handleTif}>地势Tif</Button>,
    // <Button type="primary" onClick={handleTer}>高光谱融合图</Button>,
  ];

  const measure_tool = [
    // <Button type="primary" onClick={handleMeasure}>空间距离</Button>,
    // <Button type="primary" onClick={handlegroundMeasure}>地表距离</Button>,
  ];

  const highLevelTool = [
    <Button type="primary" onClick={showEdt}>打开代码编辑器</Button>,
    // <Button type="primary" onClick={handlegroundMeasure}>地表距离</Button>,
  ];

  async function loadTileset() {
    try {
      console.log("1111yyyy")
        const tileset = await Cesium.Cesium3DTileset.fromUrl(
            'http://127.0.0.1:8000/sht/tileset.json'
        );
        console.log("Tileset loaded:", tileset);
        viewer.scene.primitives.add(tileset);
        viewer.zoomTo(tileset)
    } catch (error) {
        console.error("Failed to load tileset:", error);
    }
  }
  // loadTileset()

  // const terrainProvider = Cesium.CesiumTerrainProvider.fromUrl(
  //   'http://localhost:8000/tiles'
  // )

  // Cesium.Cartesian3.DEBUG_SHOW_DEPTH = true;
  // Cesium.Cartesian3.DEBUG_SHOW_BOUNDING_VOLUME = true;


  const terrainProvider = new Cesium.createWorldTerrainAsync({
  })

  // const imp = new Cesium.UrlTemplateImageryProvider({
  //   url: 'http://localhost:8000/all/{z}/{x}/{y}.jpg',
  //   // maximumLevel: 7,
  // })

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
        <CheckboxGroup options={plainOptions} value={checkedList} onChange={onChange} />
      </Modal>
    </Splitter.Panel>
    <Splitter.Panel collapsible min="20%">
      <div style={{width: '100%', height: '100vh', position: 'relative',}}>
        <Viewer 
        full 
        style={{width: '100%', height: '100%',}} 
        ref={e => {viewer = e && e.cesiumElement;}}
        terrainProvider={terrainProvider}
        // imageryProvider = {false}
        // baseLayerPicker = {false}
        >
        <Entity
          position={Cesium.Cartesian3.fromDegrees(114.30, 30.59, 100)}
          name="武汉"
          point={{ pixelSize: 10 }}
        />
        {/* <ImageryLayer imageryProvider={imp} /> */}
        </Viewer>
      </div>

      <div onMouseEnter={showDrawer}> <FloatButton shape="square" type="primary"style={{insetInlineEnd: 24,}}icon={<MenuUnfoldOutlined />}/></div>
      <Drawer
        title="工具箱"
        placement="left"
        onClose={onClose}
        open={visible}
        onMouseLeave={onClose}
      >
      <List
        header={<div>数据加载</div>}
        dataSource={dataload_tool}
        renderItem={(item) => (
          <List.Item>
            <Typography.Text mark></Typography.Text> {item}
          </List.Item>
        )}
      />
      <List
        header={<div>量算工具</div>}
        dataSource={measure_tool}
        renderItem={(item) => (
          <List.Item>
            <Typography.Text mark></Typography.Text> {item}
          </List.Item>
        )}
      />
      <List
        header={<div>高级设置</div>}
        dataSource={highLevelTool}
        renderItem={(item) => (
          <List.Item>
            <Typography.Text mark></Typography.Text> {item}
          </List.Item>
        )}
      />
      </Drawer>
      
    </Splitter.Panel>
  </Splitter>
  </Flex>
);}
export default CesiumApp;
