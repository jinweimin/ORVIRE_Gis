import React, { useEffect } from 'react';
import { useAppStore } from '../store';

const ContextMenu: React.FC = () => {
  const { contextMenu, setContextMenu, selectedFeature, addToast, setActiveTool } = useAppStore();

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [setContextMenu]);

  if (!contextMenu) return null;

  const hasSelection = !!selectedFeature;

  const menuItems = hasSelection
    ? [
        { icon: '⬆', label: '追踪上游', action: () => { setActiveTool('traceup'); addToast('success', '开始追踪上游管段'); } },
        { icon: '⬇', label: '追踪下游', action: () => { setActiveTool('tracedown'); addToast('success', '开始追踪下游管段'); } },
        { icon: '📊', label: '查看检测记录', action: () => addToast('success', '正在加载检测记录...') },
        { icon: '✏️', label: '编辑属性', action: () => { useAppStore.getState().setPropertyTab('properties'); addToast('success', '进入属性编辑模式'); } },
        { sep: true },
        { icon: '📏', label: '测量至...', action: () => { setActiveTool('measure'); addToast('success', '选择测量终点'); } },
        { icon: '🔍', label: '缩放至选中', action: () => addToast('success', '已缩放至选中要素') },
        { icon: '📋', label: '复制坐标', action: () => {
          if (contextMenu.lngLat) {
            navigator.clipboard?.writeText(`${contextMenu.lngLat[0].toFixed(6)}, ${contextMenu.lngLat[1].toFixed(6)}`);
            addToast('success', '坐标已复制到剪贴板');
          }
        }},
      ]
    : [
        { icon: '📏', label: '测量距离', action: () => { setActiveTool('measure'); addToast('success', '选择测量起点'); } },
        { icon: '🔍', label: '缩放至此', action: () => addToast('success', '已缩放至点击位置') },
        { icon: '📋', label: '复制坐标', action: () => {
          if (contextMenu.lngLat) {
            navigator.clipboard?.writeText(`${contextMenu.lngLat[0].toFixed(6)}, ${contextMenu.lngLat[1].toFixed(6)}`);
            addToast('success', '坐标已复制到剪贴板');
          }
        }},
      ];

  const x = Math.min(contextMenu.x, window.innerWidth - 200);
  const y = Math.min(contextMenu.y, window.innerHeight - 300);

  return (
    <div
      className="ctx-menu-overlay"
      onClick={() => setContextMenu(null)}
      onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
    >
      <div
        className="ctx-menu"
        style={{ left: x, top: y }}
        onClick={(e) => e.stopPropagation()}
      >
        {menuItems.map((item, i) => {
          if ('sep' in item && item.sep) {
            return <div key={i} className="ctx-sep" />;
          }
          const mi = item as { icon: string; label: string; action: () => void };
          return (
            <div key={i} className="ctx-item" onClick={() => { mi.action(); setContextMenu(null); }}>
              <span className="ctx-icon">{mi.icon}</span>
              <span>{mi.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContextMenu;
