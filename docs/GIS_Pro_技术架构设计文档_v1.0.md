# GIS Pro — 技术架构设计文档 v1.0

> **文档版本**：v1.0  
> **日期**：2026-05-21  
> **关联文档**：GIS功能产品需求文档_v2.md  
> **文档性质**：技术选型 + 系统架构 + 实施路线  

---

## 目录

1. [技术选型决策](#1-技术选型决策)
2. [系统架构总览](#2-系统架构总览)
3. [数据架构](#3-数据架构)
4. [模块划分与接口设计](#4-模块划分与接口设计)
5. [渲染引擎架构](#5-渲染引擎架构)
6. [空间分析引擎](#6-空间分析引擎)
7. [AI 子系统](#7-ai-子系统)
8. [性能设计](#8-性能设计)
9. [安全与权限](#9-安全与权限)
10. [部署与分发](#10-部署与分发)
11. [开发路线图](#11-开发路线图)
12. [风险评估](#12-风险评估)

---

## 1. 技术选型决策

### 1.1 桌面框架选型

#### 候选方案对比

| 维度 | **Tauri 2.x** | **Electron 33+** | **Qt 6 (C++)** | **Flutter Desktop** |
|------|---------------|------------------|----------------|---------------------|
| **语言** | Rust + TypeScript | Node.js + TypeScript | C++ / QML | Dart |
| **包体大小** | ~3–8 MB | ~150–200 MB | ~30–60 MB | ~20–40 MB |
| **内存占用** | ~50–120 MB | ~300–600 MB | ~80–200 MB | ~100–250 MB |
| **启动速度** | < 0.5s | 1.5–3s | < 0.8s | < 1s |
| **原生能力** | ✅ Rust 直接调系统 API | ⚠️ Node.js native addons | ✅ C++ 原生 | ⚠️ 插件生态有限 |
| **Web 生态复用** | ✅ WebView2/WKWebView | ✅ Chromium 完整 | ⚠️ QML 自绘 | ⚠️ 自绘引擎 |
| **GIS 前端库兼容** | ✅ MapLibre/Deck.gl/Cesium | ✅ 完整兼容 | ❌ 需自绘或嵌入 WebView | ❌ 需自绘或嵌入 WebView |
| **跨平台** | Win/macOS/Linux/iOS/Android | Win/macOS/Linux | Win/macOS/Linux/嵌入式 | Win/macOS/Linux/移动 |
| **安全性** | ✅ Rust 内存安全 + 进程隔离 | ⚠️ Node.js 沙箱较弱 | ✅ C++ 可控 | ✅ Dart 安全 |
| **社区生态** | 🔥 快速增长 | ✅ 最成熟 | ✅ 成熟（C++ 领域） | 🔥 增长中 |
| **学习曲线** | 中（需 Rust 基础） | 低（纯 JS/TS） | 高（C++ + QML） | 中（Dart） |
| **适合场景** | 轻量高性能桌面应用 | 功能丰富的企业应用 | 高性能原生应用 | 跨端 UI 统一 |

#### 推荐决策

```
┌─────────────────────────────────────────────────────────────┐
│                    推荐方案：Tauri 2.x                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  核心理由：                                                   │
│  1. 包体小（~5MB），分发友好                                   │
│  2. Rust 后端处理空间数据（SHP解析/拓扑计算）性能优异            │
│  3. WebView 复用 Web GIS 生态（MapLibre/Deck.gl/Cesium）       │
│  4. 安全模型优于 Electron                                     │
│  5. 支持未来扩展到移动端（iOS/Android）                        │
│                                                             │
│  风险点：                                                     │
│  - Rust 学习曲线，团队需 2-4 周适应期                         │
│  - WebView2 在 Windows 7 上不可用（可接受，Win7 已 EOL）      │
│  - Tauri 插件生态不如 Electron 成熟（可自研 Rust 插件弥补）     │
│                                                             │
│  备选方案：Electron（如团队 Rust 经验不足，优先上手速度）       │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 GIS 渲染引擎选型

#### 2D 渲染

| 维度 | **MapLibre GL JS** | **OpenLayers** | **Leaflet** | **Deck.gl** |
|------|-------------------|----------------|-------------|-------------|
| **渲染方式** | WebGL 矢量瓦片 | Canvas/SVG + WebGL | Canvas/SVG | WebGL 大数据 |
| **矢量瓦片** | ✅ 原生支持 (MVT) | ✅ 通过扩展 | ⚠️ 需插件 | ✅ 支持 |
| **十万级要素** | ✅ 流畅 | ⚠️ 中等 | ❌ 卡顿 | ✅ 最优 |
| **自定义图层** | ✅ 自定义图层 API | ✅ 强大 | ⚠️ 基础 | ✅ 最灵活 |
| **坐标系支持** | ✅ EPSG:3857/4326 | ✅ 任意 EPSG | ⚠️ 有限 | ✅ 3857/4326 |
| **编辑能力** | ⚠️ 需自行实现 | ✅ 内置编辑交互 | ⚠️ 需插件 | ❌ 只读 |
| **学习曲线** | 中 | 高 | 低 | 中高 |
| **社区** | 🔥 活跃 | ✅ 成熟 | ✅ 最大 | ✅ 活跃 |

**推荐：MapLibre GL JS（主渲染） + Deck.gl（大数据叠加层）**

理由：
- MapLibre 提供成熟的矢量瓦片渲染 + 交互框架
- Deck.gl 处理热力图、流向动画等大数据可视化场景
- 两者均基于 WebGL，GPU 加速一致
- MapLibre 的自定义图层 API 可无缝集成 Deck.gl

#### 3D 渲染

| 维度 | **CesiumJS** | **Deck.gl (3D)** | **Three.js 自研** |
|------|-------------|------------------|-------------------|
| **地下管网** | ✅ 挖掘地形 + 地下模式 | ⚠️ 表面为主 | ✅ 完全可控 |
| **倾斜摄影** | ✅ 3D Tiles 原生 | ❌ 不支持 | ⚠️ 需加载器 |
| **管线穿越** | ✅ Clipping Planes | ❌ 不支持 | ✅ 自定义 |
| **地形开挖** | ✅ 原生支持 | ❌ 不支持 | ⚠️ 需 Shader |
| **性能** | ⚠️ 重（Cesium 1.x ~15MB） | ✅ 轻量 | ✅ 最轻 |
| **许可** | Apache 2.0 | MIT | MIT |

**推荐：CesiumJS**

理由：
- 地下管网需要地形开挖（显示地下管线），Cesium 原生支持
- 3D Tiles 格式适合大范围三维管网
- Clipping Planes 可实现横断面切割
- 如果 3D 需求较轻量，可降级为 Three.js 自研（节省 ~10MB 包体）

### 1.3 空间数据引擎

| 维度 | **PostGIS** | **GeoPackage (SpatiaLite)** | **FlatGeobuf** | **自研 Rust 引擎** |
|------|------------|---------------------------|----------------|-------------------|
| **部署** | 需独立服务 | 单文件，嵌入式 | 单文件，流式 | 嵌入式 |
| **查询能力** | ✅ 最强（SQL） | ✅ SQL（有限） | ❌ 只能 bbox | ✅ 完全可控 |
| **并发** | ✅ 高 | ⚠️ 低 | ✅ 高（只读） | ✅ 高 |
| **空间索引** | ✅ R-tree/GiST | ✅ R-tree | ✅ R-tree (packed) | ✅ R-tree/Hilbert |
| **拓扑支持** | ✅ 原生 | ⚠️ 有限 | ❌ 无 | ✅ 自研 |
| **离线** | ❌ 需服务 | ✅ 完全离线 | ✅ 完全离线 | ✅ 完全离线 |
| **WinCan 数据** | 需 ETL 导入 | 需 ETL 导入 | 需 ETL 导入 | 需 ETL 导入 |

**推荐：GeoPackage（本地项目文件） + 自研 Rust 空间引擎（查询/分析）**

理由：
- GeoPackage 是 OGC 标准，单文件 = 项目文件（.gisproject）
- Rust 实现空间索引和查询，避免依赖外部数据库服务
- 离线优先，无需安装 PostgreSQL
- 后期可扩展 PostGIS 连接（已在 PRD 数据导入中支持）

### 1.4 技术栈总览

```
┌─────────────────────────────────────────────────────────────┐
│                      GIS Pro 技术栈                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─── 桌面壳 ─────────────────────────────────────────────┐ │
│  │  Tauri 2.x (Rust 后端 + WebView 前端)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─── 前端 ───────────────────────────────────────────────┐ │
│  │  TypeScript 5.x + React 19 (或 Vue 3.5)                │ │
│  │  MapLibre GL JS 4.x (2D 渲染)                          │ │
│  │  CesiumJS 1.x (3D 渲染)                                │ │
│  │  Deck.gl 9.x (大数据可视化叠加层)                        │ │
│  │  Zustand / Pinia (状态管理)                              │ │
│  │  TipTap / ProseMirror (标注富文本)                       │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─── 后端 (Rust) ────────────────────────────────────────┐ │
│  │  geo / geo-types (几何类型)                              │ │
│  │  rstar (R-tree 空间索引)                                 │ │
│  │  proj (坐标投影转换)                                     │ │
│  │  gdal (栅格/矢量数据读写)                                │ │
│  │  shp / geojson (格式解析)                                │ │
│  │  rusqlite + spatialite (GeoPackage 读写)                 │ │
│  │  serde / serde_json (序列化)                             │ │
│  │  tokio (异步运行时)                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─── AI 子系统 ──────────────────────────────────────────┐ │
│  │  ONNX Runtime (模型推理)                                 │ │
│  │  OpenCV (图像预处理)                                     │ │
│  │  自训练缺陷检测模型 (YOLOv8 / RT-DETR)                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─── 构建与分发 ─────────────────────────────────────────┐ │
│  │  Vite (前端构建)                                         │ │
│  │  Tauri CLI (桌面打包)                                    │ │
│  │  GitHub Actions / GitLab CI (CI/CD)                      │ │
│  │  NSIS / DMG / AppImage (安装包)                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 系统架构总览

### 2.1 分层架构

```
┌─────────────────────────────────────────────────────────────────────┐
│                          表现层 (Presentation)                       │
│  ┌───────────┬───────────┬───────────┬───────────┬───────────┐     │
│  │ 地图视图   │ 3D 视图   │ 纵断面图   │ 命令面板   │ 属性面板   │     │
│  │ (MapLibre) │ (Cesium)  │ (Canvas)  │ (React)   │ (React)   │     │
│  └─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┘     │
│        │           │           │           │           │             │
│  ┌─────▼───────────▼───────────▼───────────▼───────────▼─────┐     │
│  │              应用状态管理中心 (Zustand Store)                │     │
│  │  ┌─────────┬─────────┬─────────┬─────────┬─────────┐     │     │
│  │  │ 地图状态 │ 选择状态 │ 编辑状态 │ 视图状态 │ UI 状态  │     │     │
│  │  └─────────┴─────────┴─────────┴─────────┴─────────┘     │     │
│  └──────────────────────────┬────────────────────────────────┘     │
├─────────────────────────────┼───────────────────────────────────────┤
│                          桥接层 (Tauri IPC)                          │
│  ┌──────────────────────────▼────────────────────────────────┐     │
│  │           Tauri Command / Event 系统                       │     │
│  │  invoke("open_project") / emit("selection-changed", ...)  │     │
│  └──────────────────────────┬────────────────────────────────┘     │
├─────────────────────────────┼───────────────────────────────────────┤
│                          业务层 (Business - Rust)                    │
│  ┌───────────┬───────────┬───────────┬───────────┬───────────┐     │
│  │ 项目管理   │ 数据导入   │ 空间分析   │ 编辑引擎   │ 报告生成   │     │
│  │ .gisproject│ SHP/DXF   │ 追踪/缓冲 │ 拓扑/捕捉 │ Word/PDF  │     │
│  └─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┘     │
│        │           │           │           │           │             │
│  ┌─────▼───────────▼───────────▼───────────▼───────────▼─────┐     │
│  │                   核心引擎层 (Core Engine)                   │     │
│  │  ┌──────────┬──────────┬──────────┬──────────┬──────────┐ │     │
│  │  │ 空间索引  │ 几何运算  │ 拓扑引擎  │ 投影转换  │ 栅格引擎  │ │     │
│  │  │ R-tree   │ geo-rs   │ Graph    │ proj-rs  │ gdal-rs  │ │     │
│  │  └──────────┴──────────┴──────────┴──────────┴──────────┘ │     │
│  └───────────────────────────────────────────────────────────┘     │
├─────────────────────────────────────────────────────────────────────┤
│                          数据层 (Data)                               │
│  ┌───────────┬───────────┬───────────┬───────────┬───────────┐     │
│  │ GeoPackage │ 瓦片缓存   │ 项目配置   │ AI 模型   │ 日志/审计  │     │
│  │ .gpkg     │ MVT/PNG   │ .json/.toml│ .onnx   │ .sqlite   │     │
│  └───────────┴───────────┴───────────┴───────────┴───────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 进程模型

```
┌──────────────────────────────────────────────────────────────┐
│                    Tauri 进程模型                              │
│                                                              │
│  ┌─── 主进程 (Rust) ──────────────────────────────────────┐  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │ 窗口管理  │  │ IPC 路由  │  │ 系统托盘  │             │  │
│  │  └──────────┘  └──────────┘  └──────────┘             │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │           后台任务管理器                           │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │  │  │
│  │  │  │ 数据导入   │  │ AI 推理   │  │ 报告导出  │       │  │  │
│  │  │  │ (tokio)   │  │ (onnx)   │  │ (tokio)  │       │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘       │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
│                           │ IPC (invoke / emit)              │
│  ┌─── 渲染进程 (WebView) ─────────────────────────────────┐  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────────┐  │  │
│  │  │          React 应用 + GIS 渲染引擎                │  │  │
│  │  │  MapLibre ←→ Cesium ←→ Deck.gl                   │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │ Web Worker│  │ Offscreen│  │ Shared   │             │  │
│  │  │ (数据解析) │  │ Canvas   │  │ Array    │             │  │
│  │  └──────────┘  └──────────┘  └──────────┘             │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 通信模型

```typescript
// 前端 → 后端 (Command)
const project = await invoke<Project>("open_project", { 
  path: "D:\\Projects\\nancheng\\project.gisproject" 
});

// 后端 → 前端 (Event)
emit("import-progress", { layer: "pipe_network", progress: 0.65 });

// 前端监听事件
listen("selection-changed", (event) => {
  const { selectedIds, layerId } = event.payload;
  store.setSelection(selectedIds, layerId);
});

// 双向流式通信（大数据传输）
const stream = await invoke<Channel<Chunk>>("stream_features", { 
  layerId, 
  bbox: [minX, minY, maxX, maxY] 
});
stream.onmessage = (chunk) => renderer.addFeatures(chunk.features);
```

---

## 3. 数据架构

### 3.1 项目文件结构

```
project.gisproject/              ← 目录（非单文件，便于增量同步）
├── project.json                 ← 项目元数据
├── data/
│   ├── master.gpkg              ← 主 GeoPackage（管段/检查井/检测记录）
│   ├── basemap.gpkg             ← 底图矢量数据
│   └── overlays/                ← 叠加图层
│       ├── defects.geojson
│       └── annotations.geojson
├── tiles/                       ← 瓦片缓存
│   ├── osm/{z}/{x}/{y}.png
│   └── aerial/{z}/{x}/{y}.webp
├── inspection/                  ← CCTV 检测数据
│   ├── videos/
│   ├── frames/
│   └── reports/
├── ai/                          ← AI 模型与配置
│   ├── defect_detector_v3.onnx
│   └── config.toml
├── exports/                     ← 导出文件
├── backups/                     ← 自动备份
└── .gisproject.lock             ← 锁文件（多用户协作）
```

### 3.2 核心数据模型

#### project.json

```json
{
  "version": "3.2",
  "name": "南城区排水管网改造项目",
  "created": "2025-01-15T14:30:00+08:00",
  "modified": "2026-05-21T10:15:00+08:00",
  "crs": {
    "authority": "EPSG",
    "code": 4547,
    "name": "CGCS2000 / 3° Gauss-Kruger CM 114E",
    "transform": {
      "method": "7-param Bursa-Wolf",
      "dx": 0, "dy": 0, "dz": 0,
      "rx": 0, "ry": 0, "rz": 0,
      "scale": 0
    },
    "vertical_datum": "1985_national"
  },
  "basemap": {
    "primary": "osm",
    "sources": [
      {
        "id": "osm",
        "type": "xyz",
        "url": "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        "maxZoom": 18
      }
    ]
  },
  "layers": [
    {
      "id": "pipe_network",
      "name": "管段图层",
      "type": "line",
      "source": "data/master.gpkg",
      "table": "pipes",
      "style": { "color": "#4a90ff", "width": 3 },
      "visible": true
    },
    {
      "id": "manholes",
      "name": "检查井图层",
      "type": "point",
      "source": "data/master.gpkg",
      "table": "manholes",
      "style": { "color": "#34d399", "radius": 6 },
      "visible": true
    }
  ]
}
```

#### GeoPackage Schema（master.gpkg）

```sql
-- 管段表
CREATE TABLE pipes (
  fid          INTEGER PRIMARY KEY AUTOINCREMENT,
  geom         LINESTRING NOT NULL,
  pipe_id      TEXT UNIQUE NOT NULL,           -- 'SEC-0234'
  upstream_mh  TEXT NOT NULL,                   -- 'MH-001'
  downstream_mh TEXT NOT NULL,                  -- 'MH-002'
  diameter     INTEGER NOT NULL,                -- 400 (mm)
  material     TEXT NOT NULL,                    -- 'HDPE'
  pipe_type    TEXT NOT NULL,                    -- '污水管' / '雨水管' / '合流管'
  length       REAL,                             -- 156.3 (m)
  slope        REAL,                             -- 0.0036 (0.36%)
  flow_dir     INTEGER DEFAULT 1,               -- 1=上游→下游, -1=逆向, 0=双向
  install_date TEXT,                             -- '2018-03-15'
  status       TEXT DEFAULT 'active',           -- 'active' / 'abandoned' / 'proposed'
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);
SELECT RecoverGeometryColumn('pipes', 'geom', 4547, 'LINESTRING', 'XY');

-- 检查井表
CREATE TABLE manholes (
  fid          INTEGER PRIMARY KEY AUTOINCREMENT,
  geom         POINT NOT NULL,
  mh_id        TEXT UNIQUE NOT NULL,             -- 'MH-001'
  depth        REAL,                             -- 2.1 (m)
  mh_type      TEXT,                             -- '检查井' / '跌水井' / '溢流井'
  cover_level  REAL,                             -- 井盖标高 (m)
  invert_level REAL,                             -- 井底标高 (m)
  material     TEXT,
  install_date TEXT,
  status       TEXT DEFAULT 'active',
  created_at   TEXT DEFAULT (datetime('now')),
  updated_at   TEXT DEFAULT (datetime('now'))
);
SELECT RecoverGeometryColumn('manholes', 'geom', 4547, 'POINT', 'XY');

-- 检测记录表
CREATE TABLE inspections (
  fid          INTEGER PRIMARY KEY AUTOINCREMENT,
  pipe_id      TEXT NOT NULL REFERENCES pipes(pipe_id),
  inspect_date TEXT NOT NULL,
  method       TEXT,                             -- 'CCTV' / '声纳' / '目视'
  defect_code  TEXT,                             -- PACP 编码, 如 'CR' (裂缝)
  defect_grade INTEGER,                          -- 1-4 (I-IV)
  defect_desc  TEXT,
  video_file   TEXT,                             -- 视频文件相对路径
  start_offset REAL,                             -- 视频起始时间 (秒)
  end_offset   REAL,
  confidence   REAL,                             -- AI 置信度 (0-1)
  reviewed     INTEGER DEFAULT 0,               -- 0=待复核, 1=已复核
  reviewer     TEXT,
  review_date  TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_inspections_pipe ON inspections(pipe_id);
CREATE INDEX idx_inspections_date ON inspections(inspect_date);

-- 空间索引
CREATE INDEX idx_pipes_geom ON pipes USING rtree(geom);
CREATE INDEX idx_manholes_geom ON manholes USING rtree(geom);
```

### 3.3 数据导入管线（ETL）

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   源数据      │    │   解析层      │    │   转换层      │    │   加载层      │
│              │    │              │    │              │    │              │
│ SHP ────────►│───►│ gdal-rs     │───►│ 坐标转换      │───►│ GeoPackage   │
│ GeoJSON ────►│───►│ serde_json  │    │ (proj-rs)    │    │ (rusqlite +  │
│ DXF/DWG ───►│───►│ dxf-rs      │    │              │    │  spatialite)  │
│ WinCan XML ─►│───►│ quick-xml   │    │ 字段映射      │    │              │
│ POSM MDB ──►│───►│ mdbtools    │    │ (configurable)│   │ 拓扑构建      │
│ CSV ────────►│───►│ csv-rs      │    │              │    │ (Graph)      │
│ KML ────────►│───►│ kml-rs      │    │ 数据验证      │    │              │
│              │    │              │    │ (schema check)│   │ 空间索引      │
└─────────────┘    └─────────────┘    └─────────────┘    │ (R-tree)     │
                                                          └─────────────┘
```

#### 导入流水线 Rust 伪代码

```rust
pub struct ImportPipeline {
    source: DataSource,
    target_crs: Crs,
    field_mapping: FieldMapping,
    topology_tolerance: f64,
}

impl ImportPipeline {
    pub async fn execute(&self, progress: impl Fn(f64)) -> Result<ImportResult> {
        // 1. 解析源数据
        let raw_features = self.source.parse().await?;
        progress(0.2);
        
        // 2. 坐标转换
        let transformed = self.transform_crs(raw_features)?;
        progress(0.4);
        
        // 3. 字段映射
        let mapped = self.apply_field_mapping(transformed)?;
        progress(0.6);
        
        // 4. 数据验证
        let validated = self.validate(mapped)?;
        progress(0.7);
        
        // 5. 写入 GeoPackage
        let count = self.write_to_gpkg(&validated).await?;
        progress(0.85);
        
        // 6. 构建拓扑
        self.build_topology().await?;
        progress(0.95);
        
        // 7. 构建空间索引
        self.build_spatial_index().await?;
        progress(1.0);
        
        Ok(ImportResult { count, warnings: validated.warnings })
    }
}
```

---

## 4. 模块划分与接口设计

### 4.1 前端模块依赖图

```
@GIS-Pro
├── @core                     ← 核心状态 + IPC 通信
│   ├── store/                ← Zustand stores
│   │   ├── mapStore.ts       ← 地图视图状态
│   │   ├── layerStore.ts     ← 图层状态
│   │   ├── selectionStore.ts ← 选择状态
│   │   ├── editStore.ts      ← 编辑状态
│   │   └── uiStore.ts        ← UI 面板状态
│   ├── ipc/                  ← Tauri IPC 封装
│   │   ├── commands.ts       ← invoke 封装
│   │   └── events.ts         ← listen/emit 封装
│   └── types/                ← 共享类型定义
│
├── @map-engine               ← 地图渲染引擎
│   ├── MapLibreEngine.ts     ← 2D 引擎封装
│   ├── CesiumEngine.ts       ← 3D 引擎封装
│   ├── OverlayManager.ts     ← Deck.gl 叠加层
│   ├── StyleManager.ts       ← 样式管理
│   └── InteractionManager.ts ← 交互（选择/编辑/测量）
│
├── @panels                   ← UI 面板组件
│   ├── CommandPalette/       ← 命令面板 (Ctrl+K)
│   ├── LayerPanel/           ← 图层管理面板
│   ├── PropertyPanel/        ← 属性面板
│   ├── ProfileView/          ← 纵断面图
│   ├── Timeline/             ← 时间轴控件
│   └── Dashboard/            ← 仪表盘卡片
│
├── @analysis                 ← 空间分析前端
│   ├── NetworkTrace.ts       ← 追踪 UI
│   ├── BufferAnalysis.ts     ← 缓冲区 UI
│   ├── HeatmapLayer.ts       ← 热力图
│   └── CompareView.ts        ← 多期对比
│
├── @editor                   ← 编辑系统
│   ├── DrawTools.ts          ← 绘制工具
│   ├── SnapEngine.ts         ← 捕捉引擎
│   ├── BatchEditor.ts        ← 批量编辑
│   └── UndoRedo.ts           ← 撤销重做
│
├── @import-export            ← 数据导入导出
│   ├── ImportWizard.ts       ← 导入向导
│   ├── ExportDialog.ts       ← 导出对话框
│   └── ReportGenerator.ts    ← 报告生成
│
└── @ai                       ← AI 功能
    ├── DefectDetector.ts     ← 缺陷识别 UI
    ├── SmartSearch.ts        ← 智能搜索
    └── Recommendations.ts    ← 智能推荐
```

### 4.2 Rust 后端模块

```rust
// src-tauri/src/
├── main.rs                   ← 入口
├── lib.rs                    ← 库根
├── commands/                 ← Tauri 命令
│   ├── project.rs            ← 项目管理命令
│   ├── layer.rs              ← 图层操作命令
│   ├── feature.rs            ← 要素查询命令
│   ├── edit.rs               ← 编辑命令
│   ├── analysis.rs           ← 空间分析命令
│   ├── import.rs             ← 数据导入命令
│   ├── export.rs             ← 数据导出命令
│   └── ai.rs                 ← AI 推理命令
├── engine/                   ← 核心引擎
│   ├── geometry.rs           ← 几何类型与运算
│   ├── spatial_index.rs      ← R-tree 空间索引
│   ├── topology.rs           ← 拓扑图（有向图）
│   ├── projection.rs         ← 坐标投影转换
│   ├── raster.rs             ← 栅格处理
│   └── graph.rs              ← 网络分析（Dijkstra/BFS/DFS）
├── data/                     ← 数据层
│   ├── gpkg.rs               ← GeoPackage 读写
│   ├── shp.rs                ← Shapefile 解析
│   ├── geojson.rs            ← GeoJSON 解析
│   ├── dxf.rs                ← DXF 解析
│   ├── wincan.rs             ← WinCan XML 解析
│   └── posm.rs               ← POSM MDB 解析
├── ai/                       ← AI 子系统
│   ├── detector.rs           ← 缺陷检测推理
│   ├── model_manager.rs      ← 模型管理
│   └── pacp_codes.rs         ← PACP 编码映射
├── report/                   ← 报告生成
│   ├── docx.rs               ← Word 报告
│   ├── pdf.rs                ← PDF 报告
│   └── templates/            ← 报告模板
└── utils/                    ← 工具
    ├── config.rs             ← 配置管理
    ├── logger.rs             ← 日志
    ├── error.rs              ← 错误类型
    └── progress.rs           ← 进度报告
```

### 4.3 Tauri IPC 命令清单

```rust
// 命令签名示例

#[tauri::command]
async fn open_project(path: String) -> Result<ProjectInfo, AppError>;

#[tauri::command]
async fn get_features(
    layer_id: String, 
    bbox: [f64; 4],          // [minX, minY, maxX, maxY]
    limit: Option<usize>,
    offset: Option<usize>,
) -> Result<FeatureCollection, AppError>;

#[tauri::command]
async fn update_feature(
    layer_id: String,
    feature_id: i64,
    properties: HashMap<String, Value>,
    geometry: Option<GeoJson>,
) -> Result<(), AppError>;

#[tauri::command]
async fn network_trace(
    start_node: String,
    direction: TraceDirection,  // Upstream / Downstream / Both
    max_depth: Option<usize>,
) -> Result<TraceResult, AppError>;

#[tauri::command]
async fn import_data(
    file_paths: Vec<String>,
    target_crs: Option<u32>,
    field_mapping: Option<FieldMapping>,
    on_progress: Channel<ProgressEvent>,
) -> Result<ImportResult, AppError>;

#[tauri::command]
async fn ai_detect_defects(
    image_path: String,
    model_id: String,
) -> Result<Vec<DefectDetection>, AppError>;
```

---

## 5. 渲染引擎架构

### 5.1 2D 渲染管线

```
┌──────────────────────────────────────────────────────────────┐
│                    2D 渲染管线                                 │
│                                                              │
│  数据源                   风格                 渲染目标        │
│  ┌──────┐            ┌──────┐            ┌──────┐           │
│  │GeoPkg│───解析───►│Style │───编译───►│MapLibre│           │
│  │Rust  │   IPC     │Manager│  GL Style │  GL   │           │
│  └──────┘            └──────┘            └──────┘           │
│     │                                               │        │
│     │            ┌──────┐                           │        │
│     │            │Deck.gl│◄──叠加层──────────────────┘        │
│     │            │Overlay│   (热力图/流向动画/选中高亮)         │
│     │            └──────┘                                    │
│     │                                                        │
│     ▼                                                        │
│  ┌──────────────────────────────────────────────────┐       │
│  │              WebGL 渲染管线 (GPU)                   │       │
│  │                                                    │       │
│  │  VBO (顶点缓冲) ──► Vertex Shader ──► Fragment     │       │
│  │       ▲                           Shader ──► 屏幕   │       │
│  │       │                                             │       │
│  │  实例化渲染 (Instanced Drawing)                      │       │
│  │  - 管段: 1 draw call (所有管段)                      │       │
│  │  - 检查井: 1 draw call (所有检查井)                   │       │
│  │  - 标注: 1 draw call (所有标注)                      │       │
│  └──────────────────────────────────────────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 矢量瓦片策略

```
要素数据 ──► Rust 后端 ──► 动态矢量瓦片生成 ──► MVT 格式 ──► MapLibre 渲染

┌─────────────────────────────────────────────────────────┐
│                 动态矢量瓦片管线                           │
│                                                         │
│  GeoPackage ──► 空间查询 (R-tree bbox)                  │
│                    │                                    │
│                    ▼                                    │
│              要素裁切 (瓦片边界)                          │
│                    │                                    │
│                    ▼                                    │
│              简化 (Douglas-Peucker, 根据 zoom)           │
│                    │                                    │
│                    ▼                                    │
│              编码 (MVT protobuf)                         │
│                    │                                    │
│                    ▼                                    │
│              缓存 (内存 LRU + 磁盘)                      │
│                                                         │
│  优势: 无需预切瓦片，数据修改即时反映                      │
│  缓存策略: 数据变更时失效相关瓦片                          │
└─────────────────────────────────────────────────────────┘
```

### 5.3 3D 地下管网渲染

```
┌──────────────────────────────────────────────────────────────┐
│                    3D 渲染架构 (CesiumJS)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  地形层                                                  │  │
│  │  CesiumTerrainProvider (Cesium World Terrain / 自定义)   │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  地形开挖                                               │  │
│  │  ClippingPlaneCollection (裁切地形显示地下空间)           │  │
│  │  - 挖掘区域: 矩形 / 多边形 / 自定义                      │  │
│  │  - 挖掘深度: 可调节                                      │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  管网模型                                               │  │
│  │  Entity API / 3D Tiles                                  │  │
│  │  - 管段: CylinderGeometry (圆柱体, 按管径/埋深)          │  │
│  │  - 检查井: CylinderGeometry (竖井) + EllipseGeometry    │  │
│  │  - 缺陷标记: Billboard + Label                          │  │
│  └────────────────────────────────────────────────────────┘  │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  交互                                                   │  │
│  │  - 地下漫游: 第一人称视角沿管线移动                       │  │
│  │  - 横断面切割: ClippingPlane 动态调整                    │  │
│  │  - 2D ↔ 3D 同步: 相机矩阵映射                          │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### 5.4 纵断面图渲染

```typescript
// 纵断面图使用 Canvas 2D 自绘（非 MapLibre/Cesium）
// 原因：纵断面是工程图表，非地图渲染

interface ProfileData {
  stations: Station[];          // 沿管段的采样点
  groundElevation: number[];    // 地面高程线
  pipeTopElevation: number[];   // 管顶高程线
  pipeBottomElevation: number[];// 管底高程线
  manholes: ManholeProfile[];   // 检查井位置
  defects: DefectProfile[];     // 缺陷位置
}

class ProfileRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private transform: Transform2D;  // 数据坐标 → 屏幕坐标

  render(data: ProfileData): void {
    this.drawGrid();           // 网格
    this.drawGroundLine(data); // 地面线
    this.drawPipeSection(data);// 管道截面
    this.drawManholes(data);   // 检查井
    this.drawDefects(data);    // 缺陷标记
    this.drawAnnotations(data);// 标注（管径/坡度/埋深）
    this.drawLegend();         // 图例
  }

  // 支持缩放/平移/测量
  handleZoom(delta: number, center: Point): void;
  handlePan(dx: number, dy: number): void;
  handleMeasure(start: Point, end: Point): number;
}
```

---

## 6. 空间分析引擎

### 6.1 网络拓扑图

```rust
// 有向图表示管网拓扑
pub struct TopologyGraph {
    // 邻接表: node_id → [(connected_node_id, pipe_id)]
    adjacency: HashMap<String, Vec<(String, String)>>,
    // 反向邻接表（用于上游追踪）
    reverse_adjacency: HashMap<String, Vec<(String, String)>>,
    // 节点元数据
    nodes: HashMap<String, NodeInfo>,
    // 管段元数据
    edges: HashMap<String, EdgeInfo>,
}

impl TopologyGraph {
    /// 从管段/检查井数据构建拓扑图
    pub fn build(pipes: &[Pipe], manholes: &[Manhole]) -> Self {
        let mut graph = TopologyGraph::new();
        for pipe in pipes {
            graph.add_edge(
                &pipe.upstream_mh, 
                &pipe.downstream_mh, 
                &pipe.pipe_id,
                pipe.length,
            );
        }
        // 检测孤立节点和环路
        graph.validate();
        graph
    }

    /// 上游追踪 (BFS)
    pub fn trace_upstream(&self, start: &str, max_depth: Option<usize>) -> TraceResult {
        let mut visited = HashSet::new();
        let mut queue = VecDeque::new();
        let mut result = TraceResult::new();
        
        queue.push_back((start.to_string(), 0));
        visited.insert(start.to_string());
        
        while let Some((node, depth)) = queue.pop_front() {
            if max_depth.map_or(false, |max| depth >= max) { continue; }
            
            if let Some(neighbors) = self.reverse_adjacency.get(&node) {
                for (prev_node, pipe_id) in neighbors {
                    if visited.insert(prev_node.clone()) {
                        result.add_pipe(pipe_id.clone());
                        result.add_node(prev_node.clone());
                        queue.push_back((prev_node.clone(), depth + 1));
                    }
                }
            }
        }
        result
    }

    /// 下游追踪 (BFS)
    pub fn trace_downstream(&self, start: &str, max_depth: Option<usize>) -> TraceResult {
        // 类似 upstream，使用 adjacency 而非 reverse_adjacency
        todo!()
    }

    /// 连通性检查 (Union-Find)
    pub fn find_isolated(&self) -> Vec<Vec<String>> {
        let mut uf = UnionFind::new(self.nodes.len());
        // ... union all connected components
        // 返回未连接到主管网的管段组
        todo!()
    }

    /// 最短路径 (Dijkstra)
    pub fn shortest_path(&self, from: &str, to: &str) -> Option<Path> {
        // 基于管段长度的最短路径
        todo!()
    }

    /// 爆管分析
    pub fn burst_analysis(&self, pipe_id: &str) -> BurstResult {
        // 1. 找到受影响管段（下游所有管段）
        // 2. 找到需要关闭的阀门（最近的上游阀门）
        // 3. 计算受影响用户数
        todo!()
    }
}
```

### 6.2 空间查询引擎

```rust
pub struct SpatialEngine {
    index: RTree<Envelope>,           // R-tree 空间索引
    features: Vec<Feature>,           // 要素存储
    crs: Crs,                         // 坐标系
}

impl SpatialEngine {
    /// BBox 查询
    pub fn query_bbox(&self, bbox: Envelope) -> Vec<&Feature> {
        self.index.locate_in_envelope(&bbox)
            .map(|idx| &self.features[*idx])
            .collect()
    }

    /// 点查询（最近邻）
    pub fn query_nearest(&self, point: Point, max_distance: f64) -> Option<&Feature> {
        self.index.nearest_neighbor(&point)
            .map(|idx| &self.features[*idx])
    }

    /// 缓冲区分析
    pub fn buffer_analysis(&self, geometry: &Geometry, distance: f64) -> Vec<&Feature> {
        let buffered = geometry.buffer(distance);
        self.query_bbox(buffered.envelope())
            .into_iter()
            .filter(|f| buffered.intersects(&f.geometry))
            .collect()
    }

    /// 空间连接
    pub fn spatial_join(
        &self, 
        other: &SpatialEngine, 
        predicate: SpatialPredicate  // Intersects / Contains / Within / Crosses
    ) -> Vec<(usize, usize)> {
        // 基于 R-tree 的空间连接优化
        todo!()
    }
}
```

---

## 7. AI 子系统

### 7.1 缺陷检测架构

```
┌──────────────────────────────────────────────────────────────┐
│                    AI 缺陷检测管线                             │
│                                                              │
│  CCTV 视频 ──► 帧提取 ──► 预处理 ──► 推理 ──► 后处理 ──► 结果  │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ FFmpeg   │  │ OpenCV   │  │ ONNX     │  │ NMS +    │   │
│  │ 帧提取   │─►│ 增强/裁切 │─►│ Runtime  │─►│ 编码映射  │   │
│  │ (Rust)   │  │ (Rust)   │  │ (推理)   │  │ (Rust)   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  模型选择:                                                    │
│  - RT-DETR (实时检测, 精度高, 速度适中)                        │
│  - YOLOv8-seg (实例分割, 可精确标注缺陷区域)                   │
│  - 量化: INT8 (推理速度提升 ~2x, 精度损失 <1%)                │
│                                                              │
│  编码体系:                                                    │
│  - NASSCO PACP (美标): CR=裂缝, DJ=脱节, OV=异物, ...        │
│  - CJJ 181 (国标): CK=裂缝, TL=脱落, CJ=沉积, ...            │
│  - 自动映射: PACP ↔ CJJ 181 双向转换                          │
│                                                              │
│  性能目标:                                                    │
│  - 单帧推理: < 100ms (GPU) / < 500ms (CPU)                   │
│  - 批量处理: 30 FPS (GPU) / 5 FPS (CPU)                      │
│  - 模型大小: < 50MB (量化后)                                   │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 智能搜索 NLP

```typescript
// 自然语言搜索解析器（前端实现，无需后端 NLP 模型）
class SmartSearchParser {
  private patterns: SearchPattern[] = [
    // 管径匹配
    { regex: /DN(\d+)/i, handler: (m) => ({ field: 'diameter', op: 'eq', value: parseInt(m[1]) }) },
    // 材质匹配
    { regex: /(HDPE|PVC|混凝土|铸铁|钢管)/, handler: (m) => ({ field: 'material', op: 'eq', value: m[1] }) },
    // 年份匹配
    { regex: /(\d{4})年/, handler: (m) => ({ field: 'install_date', op: 'year', value: parseInt(m[1]) }) },
    // 缺陷匹配
    { regex: /有缺陷|缺陷/, handler: () => ({ field: 'defect_grade', op: 'gte', value: 1 }) },
    // 追踪匹配
    { regex: /(MH-\d+)\s*(上游|下游)/, handler: (m) => ({ type: 'trace', node: m[1], direction: m[2] }) },
    // 时间范围
    { regex: /最近(\d+)天检测/, handler: (m) => ({ field: 'inspect_date', op: 'last_days', value: parseInt(m[1]) }) },
  ];

  parse(input: string): SearchQuery {
    const conditions: Condition[] = [];
    let remaining = input;

    for (const pattern of this.patterns) {
      const match = remaining.match(pattern.regex);
      if (match) {
        conditions.push(pattern.handler(match));
        remaining = remaining.replace(match[0], '').trim();
      }
    }

    return { conditions, raw: input };
  }
}
```

---

## 8. 性能设计

### 8.1 性能基线与策略

| 指标 | 目标 | 策略 |
|------|------|------|
| **首屏渲染** | < 1.5s (10万要素) | 渐进加载：先渲染视口内要素，后台加载全量 |
| **缩放/平移** | < 50ms | 矢量瓦片 + GPU 渲染 + 视口裁切 |
| **命令面板** | < 30ms | 前端索引（Fuse.js），无需后端查询 |
| **网络追踪** | < 500ms (万级节点) | Rust BFS/DFS，邻接表预构建 |
| **AI 推理** | < 3s/帧 (CPU) | ONNX Runtime + INT8 量化 |
| **内存占用** | < 800MB | 分块加载 + 瓦片 LRU 缓存 + 及时释放 |

### 8.2 大数据渲染优化

```
┌─────────────────────────────────────────────────────────────┐
│                 10 万要素渲染策略                              │
│                                                             │
│  Level 1: 视口裁切                                          │
│  - 只渲染当前视口 (bbox) 内的要素                             │
│  - R-tree 查询 < 1ms                                        │
│                                                             │
│  Level 2: LOD (Level of Detail)                             │
│  - zoom < 12: 只渲染主管段 (>DN500)                          │
│  - zoom 12-14: 渲染全部管段，简化几何                         │
│  - zoom > 14: 渲染全部管段 + 检查井 + 标注                    │
│                                                             │
│  Level 3: 实例化渲染                                         │
│  - 管段: 1 次 draw call (所有管段共享顶点缓冲)                 │
│  - 检查井: 1 次 draw call                                    │
│  - 使用 WebGL Instanced Drawing                             │
│                                                             │
│  Level 4: Web Worker 离线解析                                │
│  - SHP/GeoJSON 解析在 Worker 中完成                          │
│  - 通过 Transferable Object 传递 ArrayBuffer                 │
│  - 不阻塞主线程                                              │
│                                                             │
│  Level 5: 瓦片缓存                                           │
│  - 内存缓存: 最近 500 个瓦片 (LRU)                           │
│  - 磁盘缓存: IndexedDB (离线可用)                             │
│  - 数据变更时: 只失效受影响区域的瓦片                          │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Rust ↔ WebView 数据传输优化

```rust
// 问题：10万要素通过 IPC 传输到前端会很慢
// 解决：共享内存 + 增量传输

#[tauri::command]
async fn get_features_chunked(
    layer_id: String,
    bbox: [f64; 4],
    channel: Channel<FeatureChunk>,
) -> Result<(), AppError> {
    let features = engine.query_bbox(&layer_id, bbox)?;
    
    // 分块传输，每块 1000 个要素
    for chunk in features.chunks(1000) {
        channel.send(FeatureChunk {
            features: chunk.to_vec(),
            total: features.len(),
            offset: chunk.as_ptr() as usize,
        })?;
        
        // 让出控制权，允许 UI 更新
        tokio::task::yield_now().await;
    }
    
    Ok(())
}
```

---

## 9. 安全与权限

### 9.1 安全模型

```
┌──────────────────────────────────────────────────────────────┐
│                    Tauri 安全模型                              │
│                                                              │
│  ┌─── 渲染进程 (WebView) ──────────────────────────────────┐ │
│  │  - 沙箱环境，无法直接访问文件系统                          │ │
│  │  - 所有系统调用通过 IPC 命令                               │ │
│  │  - CSP (Content Security Policy) 限制                    │ │
│  │  - 禁止 eval() / inline script                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           │ IPC (白名单命令)                   │
│  ┌─── 主进程 (Rust) ───────────────────────────────────────┐ │
│  │  - 命令白名单: 只有注册的 #[tauri::command] 可调用        │ │
│  │  - 路径校验: 禁止路径穿越 (../)                           │ │
│  │  - 权限分级: fs / shell / http 等细粒度权限              │ │
│  │  - 输入验证: 所有参数经过类型检查 + 边界检查              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                              │
│  Tauri v2 权限配置 (capabilities):                            │
│  {                                                           │
│    "permissions": [                                          │
│      "fs:allow-read",      // 只允许读取                      │
│      "fs:allow-write",     // 只允许写入到项目目录             │ │
│      "dialog:allow-open",  // 文件选择对话框                   │ │
│      "shell:allow-open"    // 打开外部链接                    │ │
│    ]                                                         │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

### 9.2 数据安全

| 场景 | 措施 |
|------|------|
| 项目文件完整性 | SHA-256 校验 + 签名 |
| 并发写入 | .gisproject.lock 锁文件 + SQLite WAL 模式 |
| 自动备份 | 每次保存前备份到 backups/，保留最近 20 个版本 |
| 数据恢复 | 启动时检测异常关闭，提示恢复 |
| 云端同步 | 仅同步增量 diff（rsync 算法），传输 TLS 加密 |

---

## 10. 部署与分发

### 10.1 构建管线

```yaml
# .github/workflows/build.yml
name: Build & Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: x86_64-pc-windows-msvc
            artifact: GIS-Pro-Setup-${{ version }}.exe
          - os: macos-latest
            target: aarch64-apple-darwin
            artifact: GIS-Pro-${{ version }}-aarch64.dmg
          - os: macos-latest
            target: x86_64-apple-darwin
            artifact: GIS-Pro-${{ version }}-x64.dmg
          - os: ubuntu-22.04
            target: x86_64-unknown-linux-gnu
            artifact: GIS-Pro-${{ version }}.AppImage

    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: cargo build --release --manifest-path src-tauri/Cargo.toml
      - run: npx tauri build
      - uses: actions/upload-artifact@v4
```

### 10.2 安装包规格

| 平台 | 格式 | 大小预估 | 签名 |
|------|------|----------|------|
| Windows | NSIS .exe | ~8–15 MB | Authenticode |
| macOS | .dmg | ~10–18 MB | Apple Notarization |
| Linux | .AppImage / .deb | ~10–15 MB | GPG |

### 10.3 自动更新

```
┌──────────────────────────────────────────────────────────────┐
│                    自动更新流程                                │
│                                                              │
│  应用启动 ──► 检查更新 (HTTPS) ──► 有新版本?                  │
│                                      │                       │
│                              ┌───────┴───────┐               │
│                              ▼               ▼               │
│                           是               否                │
│                    下载增量包 (delta)    正常启动              │
│                           │                                   │
│                    校验签名 (Ed25519)                          │
│                           │                                   │
│                    提示用户重启                                │
│                           │                                   │
│                    替换二进制 + 重启                           │
│                                                              │
│  更新源: GitHub Releases / 自建服务器                          │
│  增量更新: 使用 bsdiff 减少下载量                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 11. 开发路线图

### 11.1 里程碑规划

```
┌─────────────────────────────────────────────────────────────────────┐
│                        开发路线图                                    │
│                                                                     │
│  M0 · 技术验证 (4 周)                                               │
│  ├── Tauri 项目脚手架 + CI/CD                                       │
│  ├── MapLibre 集成 + GeoPackage 读取                                │
│  ├── Rust 空间索引 R-tree POC                                       │
│  └── 基础 IPC 通信验证                                               │
│                                                                     │
│  M1 · 核心 MVP (8 周)                                               │
│  ├── 项目管理（新建/打开/保存）                                       │
│  ├── 2D 地图渲染（管段/检查井）                                       │
│  ├── 图层管理面板                                                    │
│  ├── 属性面板（选中查看）                                             │
│  ├── 命令面板 (Ctrl+K)                                              │
│  ├── SHP/GeoJSON 导入                                              │
│  ├── 基础选择/缩放/平移                                              │
│  └── 状态栏 + 坐标显示                                               │
│                                                                     │
│  M2 · 编辑与分析 (8 周)                                              │
│  ├── 内联编辑（双击编辑几何 + 属性）                                   │
│  ├── 绘制工具（管段/检查井）                                          │
│  ├── 智能捕捉                                                        │
│  ├── 撤销/重做 (50 步)                                               │
│  ├── 上下游追踪                                                      │
│  ├── 连通性分析                                                      │
│  ├── 缓冲区分析                                                      │
│  ├── 批量编辑                                                        │
│  └── 智能搜索（自然语言）                                             │
│                                                                     │
│  M3 · 高级视图 (8 周)                                                │
│  ├── 3D 视图 (CesiumJS)                                             │
│  ├── 纵断面图                                                        │
│  ├── 分屏视图                                                        │
│  ├── 热力图 + 管龄分布                                                │
│  ├── 时间轴 + 多期对比                                                │
│  ├── 仪表盘叠加层                                                    │
│  ├── 流向动画                                                        │
│  └── 标注与批注                                                      │
│                                                                     │
│  M4 · 数据互通 (6 周)                                                │
│  ├── WinCan VX 导入                                                  │
│  ├── POSM 数据导入                                                   │
│  ├── DXF/DWG 导入                                                   │
│  ├── 多格式导出 (PDF/Shapefile/GeoJSON/KML/DXF)                     │
│  ├── 报告生成 (Word/PDF)                                             │
│  └── GeoPackage 完整读写                                             │
│                                                                     │
│  M5 · AI 集成 (6 周)                                                 │
│  ├── ONNX Runtime 集成                                               │
│  ├── CCTV 帧提取 + 预处理                                            │
│  ├── 缺陷检测模型部署                                                 │
│  ├── PACP / CJJ 181 编码映射                                         │
│  ├── 人工复核流程                                                     │
│  └── 智能推荐                                                        │
│                                                                     │
│  M6 · 打磨发布 (4 周)                                                │
│  ├── 性能优化（10 万要素 <1.5s）                                      │
│  ├── 自动更新                                                        │
│  ├── 崩溃上报 (Sentry)                                               │
│  ├── 国际化 (i18n)                                                   │
│  ├── 用户手册 + API 文档                                              │
│  └── 安装包签名 + 分发                                                │
│                                                                     │
│  总计: ~44 周 (11 个月), 3-5 人团队                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 11.2 团队配置建议

| 角色 | 人数 | 技能要求 |
|------|------|----------|
| **Rust 后端工程师** | 1–2 | Rust 熟练 + GIS/空间数据经验 |
| **前端工程师** | 1–2 | TypeScript + React/Vue + MapLibre/Cesium |
| **GIS 算法工程师** | 1 | 空间分析 + 拓扑 + 投影转换 + 数据格式 |
| **AI/ML 工程师** | 0.5–1 | ONNX Runtime + CV + 目标检测 |
| **UI/UX 设计师** | 0.5 | 桌面应用设计 + GIS 交互经验 |
| **测试工程师** | 0.5–1 | 空间数据正确性 + 性能测试 |

---

## 12. 风险评估

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| **Rust 人才招聘困难** | 高 | 高 | 备选方案：Electron + Node.js (性能降级但可行) |
| **WebView 兼容性问题** | 中 | 中 | Windows: WebView2 (Win10+); macOS: WKWebView; Linux: WebKitGTK |
| **Cesium 3D 地下渲染复杂** | 中 | 高 | 3D 作为 v2.0 功能，MVP 不含；或降级为 Three.js |
| **WinCan/POSM 数据格式文档不全** | 高 | 中 | 逆向工程 + 联系厂商获取格式规范 |
| **10 万要素性能不达标** | 中 | 高 | 增量优化：先 LOD，再 GPU 渲染，最后 WebGL Worker |
| **AI 模型精度不足** | 中 | 中 | 人工复核兜底；模型可迭代升级 |
| **项目文件格式锁定** | 低 | 高 | 采用 OGC GeoPackage 标准，避免私有格式 |
| **跨平台一致性** | 中 | 中 | CI 多平台构建 + 自动化 UI 测试 |

---

## 附录 A: 关键依赖版本

```toml
# src-tauri/Cargo.toml
[dependencies]
tauri = { version = "2", features = ["shell-open", "dialog"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
geo = "0.28"
geo-types = "0.7"
rstar = "0.12"
proj = "0.27"
gdal = "0.16"
rusqlite = { version = "0.31", features = ["bundled"] }
quick-xml = "0.36"
csv = "1.3"
uuid = { version = "1", features = ["v4"] }
chrono = { version = "0.4", features = ["serde"] }
tracing = "0.1"
tracing-subscriber = "0.3"
anyhow = "1"
thiserror = "1"

# package.json
{
  "dependencies": {
    "react": "^19.0",
    "react-dom": "^19.0",
    "maplibre-gl": "^4.7",
    "cesium": "^1.120",
    "deck.gl": "^9.0",
    "@tauri-apps/api": "^2.0",
    "zustand": "^4.5",
    "fuse.js": "^7.0"
  },
  "devDependencies": {
    "typescript": "^5.5",
    "vite": "^5.4",
    "@tauri-apps/cli": "^2.0",
    "vitest": "^2.0"
  }
}
```

## 附录 B: 命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| Rust 模块 | snake_case | `spatial_index.rs` |
| Rust 函数 | snake_case | `query_bbox()` |
| Rust 类型 | PascalCase | `TopologyGraph` |
| TypeScript 文件 | camelCase | `mapStore.ts` |
| TypeScript 类型 | PascalCase | `FeatureCollection` |
| IPC 命令 | snake_case | `get_features` |
| IPC 事件 | kebab-case | `selection-changed` |
| GeoPackage 表 | snake_case | `pipe_network` |
| CSS 类 | BEM 或 kebab-case | `.preview-card__title` |

---

> **文档结束**  
> 下一步：基于本文档创建 M0 技术验证 POC。
