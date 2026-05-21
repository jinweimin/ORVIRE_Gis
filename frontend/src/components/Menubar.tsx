import React, { useState } from 'react';

const menuItems = ['文件', '编辑', '视图', '图层', '分析', '工具', '窗口', '帮助'];

const Menubar: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(4);

  return (
    <div className="mbar">
      {menuItems.map((item, i) => (
        <div
          key={item}
          className={`mi${i === activeIndex ? ' on' : ''}`}
          onClick={() => setActiveIndex(i)}
        >
          {item}
        </div>
      ))}
    </div>
  );
};

export default Menubar;
