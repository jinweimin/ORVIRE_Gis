import { useState } from 'react';
import { useAppStore } from '../store';

const FIELD_LABELS: Record<string, string> = {
  pipe_id: '编号', upstream_mh: '上游检查井', downstream_mh: '下游检查井',
  diameter: '管径 (mm)', material: '材质', pipe_type: '管段类型',
  length: '长度 (m)', slope: '坡度 (%)', install_date: '安装日期',
  defect_grade: '缺陷等级', mh_id: '编号', depth: '井深 (m)',
  mh_type: '井型', cover_level: '井盖标高 (m)', invert_level: '井底标高 (m)',
};

export default function PropertyPanel() {
  const { selectedFeature, propertyTab, setPropertyTab, addToast, selectedFeatureIds } = useAppStore();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (key: string, value: unknown) => {
    setEditingKey(key);
    setEditValue(String(value));
  };

  const saveEdit = () => {
    if (selectedFeature && editingKey) {
      selectedFeature.properties[editingKey] = editValue;
      addToast('success', `${FIELD_LABELS[editingKey] || editingKey} 已更新`);
    }
    setEditingKey(null);
  };

  const renderProperties = () => {
    if (!selectedFeature) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--t4)' }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📍</div>
          <div style={{ fontSize: 11.5 }}>点击地图上的要素查看属性</div>
          {selectedFeatureIds.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ac)' }}>
              已选中 {selectedFeatureIds.length} 个要素
            </div>
          )}
        </div>
      );
    }

    const { type, properties } = selectedFeature;
    const entries = Object.entries(properties).filter(([k]) => k !== 'coordinates');

    return (
      <>
        <div className="topo-ok">
          <span style={{ fontSize: 14 }}>✓</span>
          <div>
            <div style={{ fontSize: 10.5, color: 'var(--gn)', fontWeight: 600 }}>拓扑状态: 正常</div>
            <div style={{ fontSize: 9, color: 'var(--t4)' }}>所有管段连接完整</div>
          </div>
        </div>
        <div className="ps">
          <div className="ps-t">
            选中对象{' '}
            <span className="bg" style={{ background: 'var(--acd)', color: 'var(--ac)' }}>
              {type === 'pipe' ? '管段' : '检查井'}
            </span>
          </div>
          {entries.map(([key, value]) => {
            const label = FIELD_LABELS[key] || key;
            const isId = key.includes('id');
            return (
              <div className="pr2" key={key} onDoubleClick={() => startEdit(key, value)}>
                <span className="k">{label}</span>
                {editingKey === key ? (
                  <input
                    className="edit-input"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={saveEdit}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingKey(null); }}
                    autoFocus
                  />
                ) : (
                  <span className={`vl${isId ? ' a' : ''}`}>{String(value)}</span>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '8px 0', fontSize: 9.5, color: 'var(--t5)', textAlign: 'center' }}>
          双击属性值可编辑
        </div>
      </>
    );
  };

  const renderDashboard = () => (
    <>
      <div className="mc">
        <div className="mc-t">管网统计</div>
        {[
          { label: '总管段', value: 20, pct: 85, color: 'var(--ac)' },
          { label: '总检查井', value: 15, pct: 62, color: 'var(--gn)' },
          { label: '已检测', value: 18, pct: 73, color: 'var(--pu)' },
          { label: '缺陷管段', value: 3, pct: 15, color: 'var(--rd)' },
        ].map(item => (
          <div className="br" key={item.label}>
            <span className="bl" style={{ width: 50 }}>{item.label}</span>
            <div className="bt"><div className="bf" style={{ width: `${item.pct}%`, background: item.color }} /></div>
            <span className="bv">{item.value}</span>
          </div>
        ))}
      </div>
      <div className="mc">
        <div className="mc-t">缺陷等级分布 (PACP)</div>
        {[
          { label: 'I', pct: 45, color: 'var(--gn)' },
          { label: 'II', pct: 30, color: 'var(--yw)' },
          { label: 'III', pct: 18, color: 'var(--or)' },
          { label: 'IV', pct: 7, color: 'var(--rd)' },
        ].map(item => (
          <div className="br" key={item.label}>
            <span className="bl">{item.label}</span>
            <div className="bt"><div className="bf" style={{ width: `${item.pct}%`, background: item.color }} /></div>
            <span className="bv">{item.pct}%</span>
          </div>
        ))}
      </div>
      <div className="mc">
        <div className="mc-t">今日检测进度</div>
        <div style={{ textAlign: 'center', padding: '14px 0' }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 30, fontWeight: 700, color: 'var(--ac)' }}>3</div>
          <div style={{ fontSize: 10, color: 'var(--t4)' }}>段已检测 / 计划 5 段</div>
          <div style={{ marginTop: 10, height: 7, background: 'var(--s2)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, var(--ac), var(--gn))', borderRadius: 4 }} />
          </div>
        </div>
      </div>
    </>
  );

  const renderHistory = () => (
    <div className="ps">
      <div className="ps-t">
        编辑历史{' '}
        <span className="bg" style={{ background: 'var(--gnd)', color: 'var(--gn)' }}>可撤销</span>
      </div>
      <div style={{ fontSize: 10.5, color: 'var(--t2)', lineHeight: 2.2 }}>
        {[
          { time: '14:32', label: '创建管段', desc: '#848 → MH-015~016', color: 'var(--ac)' },
          { time: '14:28', label: '放置检查井', desc: 'MH-016', color: 'var(--gn)' },
          { time: '14:15', label: '修改属性', desc: 'SEC-0230 DN300→400', color: 'var(--yw)' },
          { time: '13:55', label: '删除管段', desc: '#612（孤立）', color: 'var(--rd)' },
          { time: '13:20', label: 'WinCan传输', desc: '28条 → VX', color: 'var(--ac)' },
        ].map(item => (
          <div key={item.time + item.label} style={{ display: 'flex', gap: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: 'var(--t5)', minWidth: 38 }}>{item.time}</span>
            <span style={{ color: item.color, fontWeight: 600 }}>{item.label}</span>
            <span style={{ color: 'var(--t4)' }}>{item.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pr">
      <div className="ph"><h4>属性</h4></div>
      <div className="p-tabs">
        {(['properties', 'dashboard', 'history'] as const).map(tab => (
          <div key={tab} className={`pt${propertyTab === tab ? ' on' : ''}`} onClick={() => setPropertyTab(tab)}>
            {tab === 'properties' ? '属性' : tab === 'dashboard' ? '仪表盘' : '历史'}
          </div>
        ))}
      </div>
      <div className="pp">
        {propertyTab === 'properties' && renderProperties()}
        {propertyTab === 'dashboard' && renderDashboard()}
        {propertyTab === 'history' && renderHistory()}
      </div>
    </div>
  );
}
