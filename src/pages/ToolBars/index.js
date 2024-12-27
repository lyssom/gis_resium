import React, { useState } from 'react';
import { Drawer, Button, Divider, List, FloatButton, Typography,  notification, Space  } from 'antd';

import { useDispatch } from 'react-redux';
import {collapseMenu} from '../../store/reducers/tab'
import {loadTiles} from '../../store/reducers/tiles'
import {loadTer} from '../../store/reducers/ter'
import {loadTif} from '../../store/reducers/tif'
import {groundMeasureState} from '../../store/reducers/groundMeasure'

import { MenuUnfoldOutlined } from '@ant-design/icons';

const ToolBars = ({ collapsed, isLoadtile }) => {
  console.log(9999)
  const [visible, setVisible] = useState(false);
  const [divPosition, setDivPosition] = useState('0px');

  const showDrawer = () => {
    setVisible(true);
    setDivPosition('250px');
  };

  const onClose = () => {
    setVisible(false);
    setDivPosition('0px');
  };

  const dispatch = useDispatch();

  const handleMeasure = () => {
    dispatch(collapseMenu())
  };

  const handleTiles3D = () => {
    dispatch(loadTiles())
  };

  const handleTif = () => {
    dispatch(loadTif())
  };

  const handleTer = () => {
    dispatch(loadTer())
  };

  const handlegroundMeasure = () => {
    console.log("触发地表距离测量功能1111");
    dispatch(groundMeasureState())
  };

  const [api, contextHolder] = notification.useNotification();

  const close = () => {
    console.log(
      'Notification was closed. Either the close button was clicked or duration time elapsed.',
    );
  };

  const openNotification = (placement) => {
    api.info({
      message: `功能开发中`,
      // description:'请加钱',
      placement,
    });
  };


  const dataload_tool = [
    <Button type="primary" onClick={handleTiles3D}>3Dtiles</Button>,
    <Button type="primary" onClick={handleTif}>地势Tif</Button>,
    <Button type="primary" onClick={handleTer}>高光谱融合图</Button>,
  ];

  const measure_tool = [
    <Button type="primary" onClick={handleMeasure}>空间距离</Button>,
    <Button type="primary" onClick={handlegroundMeasure}>地表距离</Button>,
  ];

  return (
    <>
      {contextHolder}
      <Space>
      <div>
      <div onMouseEnter={showDrawer}> <FloatButton shape="square" type="primary"style={{insetInlineEnd: 24,}}icon={<MenuUnfoldOutlined />}/></div>
      <Drawer
        title="工具箱"
        placement="left"
        onClose={onClose}
        open={visible}
        onMouseLeave={onClose}  // 鼠标移出抽屉时关闭抽屉
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
      </Drawer>
    </div>
      </Space>
    </>
  );
};

export default ToolBars;
