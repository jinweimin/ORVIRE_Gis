import { useState, useRef } from 'react';
import { useAppStore } from '../store';

export default function ImportPanel() {
  const { setImportPanelOpen, addToast } = useAppStore();
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<{ name: string; format: string; status: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles = droppedFiles.map(f => ({
      name: f.name,
      format: f.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      status: 'ready',
    }));
    setFiles(prev => [...prev, ...newFiles]);
    addToast('success', `${droppedFiles.length} 个文件已添加`);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles = selectedFiles.map(f => ({
      name: f.name,
      format: f.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      status: 'ready',
    }));
    setFiles(prev => [...prev, ...newFiles]);
    addToast('success', `${selectedFiles.length} 个文件已添加`);
  };

  const handleImport = () => {
    if (files.length === 0) {
      addToast('warning', '请先选择要导入的文件');
      return;
    }
    setFiles(prev => prev.map(f => ({ ...f, status: 'importing' })));
    setTimeout(() => {
      setFiles(prev => prev.map(f => ({ ...f, status: 'success' })));
      addToast('success', `${files.length} 个文件导入成功！`);
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={() => setImportPanelOpen(false)}>
      <div className="import-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📥 导入数据</h3>
          <button className="modal-close" onClick={() => setImportPanelOpen(false)}>✕</button>
        </div>
        <div className="modal-body-content">
          <div
            className={`wdrop${dragOver ? ' over' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="wd-icon">📂</div>
            <div className="wd-text">拖放数据文件到此处，或点击浏览</div>
            <div className="wd-hint">支持多种格式自动识别</div>
            <div className="wd-formats">
              {['SHP', 'GeoJSON', 'DXF/DWG', 'KML', 'CSV', 'GML', 'WinCan XML', 'POSM MDB'].map(f => (
                <span key={f} className="fmt">{f}</span>
              ))}
            </div>
            <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
          </div>

          {files.length > 0 && (
            <div className="wsec" style={{ marginTop: 16 }}>
              <div className="wsec-t">已选择文件 <span className="count">{files.length} 个</span></div>
              <div className="imp-list">
                {files.map((f, i) => (
                  <div key={i} className="imp-item">
                    <span className="fi">
                      {f.format === 'SHP' ? '📐' : f.format === 'GEOJSON' ? '🗺️' : f.format === 'DXF' ? '📐' : '📄'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="fn">{f.name}</div>
                      <div className="fm">{f.format} 格式</div>
                    </div>
                    <span className={`fs ${f.status === 'success' ? 'ok' : f.status === 'importing' ? 'wn' : 'ok'}`}>
                      {f.status === 'success' ? '✓ 完成' : f.status === 'importing' ? '⏳ 导入中...' : '✓ 就绪'}
                    </span>
                    <div className="fx" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>×</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="wsec" style={{ marginTop: 16 }}>
            <div className="wsec-t">数据库连接</div>
            <div className="wg g4">
              {[
                { icon: '🐘', name: 'PostGIS', desc: 'PostgreSQL 空间数据库' },
                { icon: '🗄️', name: 'SQL Server', desc: 'SQL Server 空间表' },
                { icon: '🗃️', name: 'GeoPackage', desc: 'OGC GeoPackage 文件' },
                { icon: '☁️', name: 'ArcGIS', desc: 'ArcGIS Online / Server' },
              ].map(db => (
                <div key={db.name} className="wc" onClick={() => addToast('success', `${db.name} 连接配置已打开`)}>
                  <span className="wi">{db.icon}</span>
                  <div className="wn">{db.name}</div>
                  <div className="wd">{db.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="wbtn gh" onClick={() => setImportPanelOpen(false)}>取消</button>
          <button className="wbtn pri" onClick={handleImport}>📥 导入</button>
        </div>
      </div>
    </div>
  );
}
