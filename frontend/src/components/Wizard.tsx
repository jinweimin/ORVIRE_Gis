import { useState } from 'react';
import { useAppStore } from '../store';

const CRS_LIST = [
  { name: 'CGCS2000 / 3° Gauss-Kruger CM 114E', epsg: '4547', desc: '中央经线 114°E · 高斯-克吕格投影 · 单位: 米' },
  { name: 'CGCS2000 / 3° Gauss-Kruger CM 117E', epsg: '4548', desc: '中央经线 117°E' },
  { name: 'CGCS2000 / 3° Gauss-Kruger CM 120E', epsg: '4549', desc: '中央经线 120°E' },
  { name: 'CGCS2000 Geographic', epsg: '4490', desc: '经纬度坐标' },
  { name: 'WGS 84 Geographic', epsg: '4326', desc: 'GPS 全球定位基准' },
  { name: 'WGS 84 / Pseudo-Mercator', epsg: '3857', desc: 'Web 地图标准投影' },
];

const BASEMAPS = [
  { id: 'osm', name: 'OpenStreetMap', desc: '全球道路地图', icon: '🗺️' },
  { id: 'dark', name: '暗色底图', desc: '深色风格突出管网', icon: '🌑', rec: true },
  { id: 'satellite', name: '卫星影像', desc: '高分辨率遥感', icon: '🛰️' },
  { id: 'terrain', name: '地形图', desc: '等高线与地形', icon: '⛰️' },
  { id: 'tdt', name: '天地图', desc: '国家地理信息平台', icon: '🇨🇳' },
];

export default function Wizard() {
  const { wizardStep, setWizardStep, setWizardOpen } = useAppStore();
  const [projectType, setProjectType] = useState('new');
  const [selectedCrs, setSelectedCrs] = useState('4547');
  const [selectedBasemap, setSelectedBasemap] = useState('dark');
  const [crsSearch, setCrsSearch] = useState('');

  const steps = [
    { title: '欢迎', desc: '新建或打开项目' },
    { title: '坐标系统', desc: '投影与基准面设定' },
    { title: '底图配置', desc: '在线/离线底图' },
    { title: '数据导入', desc: '管网、检测、矢量' },
    { title: '确认启动', desc: '项目概览与启动' },
  ];

  const filteredCrs = crsSearch
    ? CRS_LIST.filter(c => c.name.toLowerCase().includes(crsSearch.toLowerCase()) || c.epsg.includes(crsSearch))
    : CRS_LIST;

  const handleFinish = () => {
    setWizardOpen(false);
    useAppStore.getState().addToast('success', '项目创建成功！');
  };

  return (
    <div className="wiz-overlay">
      <div className="wizard">
        <div className="wiz-side">
          <div className="wiz-logo">
            <h2><span className="dot" /> GIS Pro</h2>
            <p>智能管网地理信息系统 v3.2</p>
          </div>
          <div className="wiz-steps">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`ws${i === wizardStep ? ' active' : ''}${i < wizardStep ? ' done' : ''}`}
                onClick={() => setWizardStep(i)}
              >
                <div className="ws-n">{i < wizardStep ? '✓' : i + 1}</div>
                <div>
                  <div className="ws-t">{s.title}</div>
                  <div className="ws-d">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="wiz-body">
          <div className="wiz-content">
            {/* Step 0: Welcome */}
            {wizardStep === 0 && (
              <div>
                <div style={{ textAlign: 'center', padding: '16px 0 4px' }}>
                  <span style={{ fontSize: 52, display: 'block', marginBottom: 14 }}>🌐</span>
                  <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>欢迎使用 GIS Pro</h2>
                  <p style={{ fontSize: 13, color: 'var(--t3)', lineHeight: 1.6, maxWidth: 420, margin: '0 auto' }}>
                    专业级地下管网 GIS 平台。集成 WinCan 数据互通、POSM CCTV 检测管理、SewerAI 智能缺陷识别。
                  </p>
                </div>
                <div className="wsec" style={{ marginTop: 26 }}>
                  <div className="wsec-t">开始方式</div>
                  <div className="wg g2">
                    {[
                      { id: 'new', icon: '📁', name: '新建项目', desc: '从空白项目开始配置', rec: true },
                      { id: 'open', icon: '📂', name: '打开项目', desc: '打开已有 .gisproject 文件' },
                      { id: 'wincan', icon: '🔬', name: '导入 WinCan VX', desc: '从 WinCan 导入检测数据', tag: 'NEW' },
                      { id: 'posm', icon: '📹', name: '导入 POSM 数据', desc: '兼容 POSM Pro/Lite' },
                    ].map(item => (
                      <div key={item.id} className={`wc${projectType === item.id ? ' sel' : ''}`} onClick={() => setProjectType(item.id)}>
                        <span className="wi">{item.icon}</span>
                        <div className="wn">{item.name}</div>
                        <div className="wd">{item.desc}</div>
                        {item.rec && <div className="wt rec">推荐</div>}
                        {item.tag && <div className="wt new">{item.tag}</div>}
                        <div className="wr" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: CRS */}
            {wizardStep === 1 && (
              <div>
                <div className="wp-title">选择坐标系统</div>
                <div className="wp-sub">坐标系统决定地图投影方式和空间数据定位基准。</div>
                <div className="wsec">
                  <div className="wsec-t">快速选择 <span className="count">常用</span></div>
                  <div className="wg g3">
                    {[
                      { id: '4547', icon: '🇨🇳', name: 'CGCS2000', desc: '2000国家大地坐标系', rec: true },
                      { id: '4326', icon: '🌍', name: 'WGS 84', desc: 'GPS全球定位系统' },
                      { id: 'local', icon: '📐', name: '地方独立坐标', desc: '自定义原点工程坐标系' },
                    ].map(c => (
                      <div key={c.id} className={`wc${selectedCrs === c.id ? ' sel' : ''}`} onClick={() => setSelectedCrs(c.id)}>
                        <span className="wi">{c.icon}</span>
                        <div className="wn">{c.name}</div>
                        <div className="wd">{c.desc}</div>
                        {c.rec && <div className="wt rec">推荐</div>}
                        <div className="wr" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="wsec">
                  <div className="wsec-t">坐标系库</div>
                  <div style={{ marginBottom: 10 }}>
                    <input className="win" placeholder="EPSG 代码或名称..." value={crsSearch} onChange={e => setCrsSearch(e.target.value)} />
                  </div>
                  <div className="crs-tree">
                    {filteredCrs.map(c => (
                      <div key={c.epsg} className={`crs-i${selectedCrs === c.epsg ? ' on' : ''}`} onClick={() => setSelectedCrs(c.epsg)}>
                        <span>{c.name}</span>
                        <span className="epsg">EPSG:{c.epsg}</span>
                      </div>
                    ))}
                  </div>
                  <div className="crs-detail">
                    <div className="cd-icon">📍</div>
                    <div>
                      <div className="cd-name">{CRS_LIST.find(c => c.epsg === selectedCrs)?.name || ''}</div>
                      <div className="cd-meta">EPSG:{selectedCrs} · {CRS_LIST.find(c => c.epsg === selectedCrs)?.desc || ''}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Basemap */}
            {wizardStep === 2 && (
              <div>
                <div className="wp-title">配置底图</div>
                <div className="wp-sub">底图提供地理参照背景，支持在线瓦片服务。</div>
                <div className="wsec">
                  <div className="wsec-t">在线底图服务 <span className="count">{BASEMAPS.length} 可用</span></div>
                  <div className="wg g3">
                    {BASEMAPS.map(bm => (
                      <div key={bm.id} className={`wc${selectedBasemap === bm.id ? ' sel' : ''}`} onClick={() => setSelectedBasemap(bm.id)}>
                        <span className="wi">{bm.icon}</span>
                        <div className="wn">{bm.name}</div>
                        <div className="wd">{bm.desc}</div>
                        {bm.rec && <div className="wt rec">推荐</div>}
                        <div className="wr" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="wsec">
                  <div className="wsec-t">服务连接配置</div>
                  <div className="wr2">
                    <div className="f" style={{ flex: 2 }}>
                      <label className="wl">服务地址 (URL)</label>
                      <input className="win" value="https://tile.openstreetmap.org/{z}/{x}/{y}.png" readOnly style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }} />
                    </div>
                    <div className="f">
                      <label className="wl">服务类型</label>
                      <select className="wsel"><option>XYZ 瓦片</option></select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Data Import */}
            {wizardStep === 3 && (
              <div>
                <div className="wp-title">导入管网数据</div>
                <div className="wp-sub">导入 GIS 矢量数据、检测报告或数据库连接。</div>
                <div className="wsec">
                  <div className="wdrop" onClick={() => useAppStore.getState().setImportPanelOpen(true)}>
                    <div className="wd-icon">📂</div>
                    <div className="wd-text">拖放数据文件到此处，或点击浏览</div>
                    <div className="wd-hint">支持多种格式自动识别</div>
                    <div className="wd-formats">
                      {['SHP', 'GeoJSON', 'DXF/DWG', 'KML', 'CSV', 'WinCan XML', 'POSM MDB'].map(f => (
                        <span key={f} className="fmt">{f}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="wsec">
                  <div className="wsec-t">已导入文件 <span className="count">2 个文件</span></div>
                  <div className="imp-list">
                    <div className="imp-item">
                      <span className="fi">📐</span>
                      <div style={{ flex: 1 }}><div className="fn">pipe_network.geojson</div><div className="fm">管段图层 · 20 要素 · WGS84</div></div>
                      <span className="fs ok">✓ 就绪</span>
                    </div>
                    <div className="imp-item">
                      <span className="fi">📍</span>
                      <div style={{ flex: 1 }}><div className="fn">manholes.geojson</div><div className="fm">检查井图层 · 15 要素 · WGS84</div></div>
                      <span className="fs ok">✓ 就绪</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Summary */}
            {wizardStep === 4 && (
              <div>
                <div className="wp-title">项目概览</div>
                <div className="wp-sub">请确认以下配置信息，点击"启动工作空间"开始使用。</div>
                <div className="sum-card">
                  <div className="sc-t"><span className="sc-icon">📁</span> 项目信息</div>
                  <div className="sr"><span className="sk">项目名称</span><span className="sv a">南城区排水管网改造项目</span></div>
                  <div className="sr"><span className="sk">创建时间</span><span className="sv">{new Date().toLocaleString('zh-CN')}</span></div>
                </div>
                <div className="sum-card">
                  <div className="sc-t"><span className="sc-icon">📍</span> 坐标系统</div>
                  <div className="sr"><span className="sk">坐标系</span><span className="sv a">{CRS_LIST.find(c => c.epsg === selectedCrs)?.name}</span></div>
                  <div className="sr"><span className="sk">EPSG</span><span className="sv">{selectedCrs}</span></div>
                </div>
                <div className="sum-card">
                  <div className="sc-t"><span className="sc-icon">🗺️</span> 底图配置</div>
                  <div className="sr"><span className="sk">在线底图</span><span className="sv g">{BASEMAPS.find(b => b.id === selectedBasemap)?.name}</span></div>
                </div>
                <div className="sum-card">
                  <div className="sc-t"><span className="sc-icon">📊</span> 数据导入</div>
                  <div className="sr"><span className="sk">管段数据</span><span className="sv g">pipe_network.geojson · 20 条</span></div>
                  <div className="sr"><span className="sk">检查井数据</span><span className="sv g">manholes.geojson · 15 个</span></div>
                </div>
              </div>
            )}
          </div>
          <div className="wiz-foot">
            <button className="wbtn gh" onClick={() => setWizardStep(Math.max(0, wizardStep - 1))} style={{ visibility: wizardStep === 0 ? 'hidden' : 'visible' }}>
              ← 上一步
            </button>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="wbtn gh" onClick={() => setWizardOpen(false)}>跳过向导</button>
              <button className="wbtn pri" onClick={wizardStep === 4 ? handleFinish : () => setWizardStep(wizardStep + 1)}>
                {wizardStep === 4 ? '🚀 启动工作空间' : '下一步 →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
