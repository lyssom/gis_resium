import { useEffect, useState } from 'react';
import './Lic.css';
import { getlicinfo } from '../api/index.js';

const Lic = () => {
  const [licinfo, setLicInfo] = useState({
    licType: '',
    licStart: '',
    licEnd: '',
    licMac: ''
  });

  useEffect(() => {
    // 调用接口获取授权信息
    const fetchData = async () => {
      try {
        const res = await getlicinfo();
        setLicInfo(res.data); // 假设接口返回的是 { licType, licStart, licEnd, licMac }
      } catch (error) {
        console.error('获取授权信息失败:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="lic-wrapper">
      <div className="lic-card">
        <div className="lic-header">
          <div>
            <h2 className="lic-title">授权已到期</h2>
            <p className="lic-subtitle">请及时联系管理员续期，避免影响系统使用。</p>
          </div>
        </div>

        <div className="lic-info-grid">
          <div className="lic-info-item">
            <span className="lic-label">证书类型</span>
            <span className="lic-value">{licinfo.licType || '—'}</span>
          </div>
          <div className="lic-info-item">
            <span className="lic-label">开始日期</span>
            <span className="lic-value">{licinfo.licStart || '—'}</span>
          </div>
          <div className="lic-info-item">
            <span className="lic-label">结束日期</span>
            <span className="lic-value">{licinfo.licEnd || '—'}</span>
          </div>
          { (licinfo.licMac !== '') && (<div className="lic-info-item">
            <span className="lic-label">MAC 地址</span>
            <span className="lic-value">{licinfo.licMac}</span>
          </div>)}
        </div>
      </div>
    </div>
  );
};

export default Lic;
