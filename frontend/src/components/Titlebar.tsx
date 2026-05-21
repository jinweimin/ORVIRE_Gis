import React from 'react';

const Titlebar: React.FC = () => {
  return (
    <div className="tbar">
      <div className="tdots">
        <i></i><i></i><i></i>
      </div>
      <div className="ttitle">
        <b>GIS Pro</b>
        <span className="s">—</span>
        南城区排水管网改造项目
        <span className="s">·</span>
        <span className="tbadge">CGCS2000 EPSG:4547 ▾</span>
      </div>
      <div style={{ width: 58 }}></div>
    </div>
  );
};

export default Titlebar;
