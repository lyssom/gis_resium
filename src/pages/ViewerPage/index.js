import { useEffect, useState, useRef } from "react";
import * as Cesium from "cesium";
import { Col, InputNumber, Row, Slider, Space } from 'antd';

import { Editor } from "@monaco-editor/react";
import { MenuUnfoldOutlined } from '@ant-design/icons';
import { Button, Drawer, FloatButton, List, Typography, Flex, Splitter, Modal, Checkbox, Switch, Divider } from 'antd';

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

  const CheckboxGroup = Checkbox.Group
  const plainOptions = ['代码', '实体'];
  const defaultCheckedList = ['代码', '实体'];

  const [checkedList, setCheckedList] = useState(defaultCheckedList);
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
            onChange={onExaggerChange}
            value={inputValue}
          />
        </Col>
        <Col span={4}>
          <InputNumber
            min={1}
            max={10}
            style={{ margin: '0 16px' }}
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
    // 创建 Viewer 实例
    const viewerInstance = new Cesium.Viewer(viewerRef.current, {
        terrain: new Cesium.Terrain(Cesium.CesiumTerrainProvider.fromUrl(
          // "http://data.mars3d.cn/terrain/"
          "http://localhost:8000/tiles"
          ))
    });
    // console.log('terrainProvider:', viewerInstance.scene.terrainProvider);
    viewer.current = viewerInstance; // 保存 Viewer 实例
    viewerInstance.scene.verticalExaggeration = inputValue;
    
    viewerInstance.entities.add({
      name: '丰润区中心点',
      position: Cesium.Cartesian3.fromDegrees(118.05, 39.80),
      point: {
        pixelSize: 10,
        color: Cesium.Color.RED,
      }
    });

    return () => {
      viewerInstance.destroy();
    };
  }, []);

  useEffect(() => {
    if (viewer.current) {
      viewer.current.scene.verticalExaggeration = inputValue;
      console.log('Vertical exaggeration updated:', inputValue);
    }
  }, [inputValue]);

  const runCode = () => {
    try {
      // const viewer = viewerRef.current.cesiumElement;
      const userFunction = new Function("viewer", "Cesium", code);
      userFunction(viewer, Cesium);
    } catch (error) {
      alert("代码运行错误：" + error.message);
    }
  };


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
  );
};

export default ViewerPage;


