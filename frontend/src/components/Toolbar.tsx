import { useAppStore } from '../store';
import { useMapContext } from '../hooks/useMapContext';

export default function Toolbar() {
  const { activeTool, setActiveTool, viewMode, setViewMode, toggleCommandPalette } = useAppStore();
  const { zoomToExtent } = useMapContext();

  return (
    <div className="tbar2">
      <div className="tg">
        <div className={`tb${activeTool==='select'?' on':''}`} onClick={()=>setActiveTool('select')}><svg viewBox="0 0 16 16"><path d="M3 2l7 12 1.5-4.5L16 8z"/></svg><span className="tp">选择 (V)</span></div>
        <div className={`tb${activeTool==='boxselect'?' on':''}`} onClick={()=>setActiveTool('boxselect')}><svg viewBox="0 0 16 16"><rect x="2" y="2" width="12" height="12" rx="1" strokeDasharray="3 2"/></svg><span className="tp">框选</span></div>
      </div>
      <div className="sep"/>
      <div className="tg">
        <div className="tb"><svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14"/><line x1="5" y1="7" x2="9" y2="7"/><line x1="7" y1="5" x2="7" y2="9"/></svg><span className="tp">放大</span></div>
        <div className="tb"><svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14"/><line x1="5" y1="7" x2="9" y2="7"/></svg><span className="tp">缩小</span></div>
        <div className="tb" onClick={zoomToExtent}><svg viewBox="0 0 16 16"><rect x="1" y="1" width="14" height="14" rx="1.5"/><polyline points="5,5 11,5 11,11 5,11"/></svg><span className="tp">全图 (Home)</span></div>
        <div className="tb"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="6" strokeDasharray="2 1.5"/></svg><span className="tp">缩放至选中</span></div>
      </div>
      <div className="sep"/>
      <div className="tg">
        <div className={`tb${activeTool==='drawpipe'?' on':''}`} onClick={()=>setActiveTool('drawpipe')}><svg viewBox="0 0 16 16"><line x1="2" y1="14" x2="14" y2="2"/><circle cx="2" cy="14" r="2" fill="currentColor" stroke="none"/><circle cx="14" cy="2" r="2" fill="currentColor" stroke="none"/></svg><span className="tp">绘制管段 (L)</span></div>
        <div className={`tb${activeTool==='drawmanhole'?' on':''}`} onClick={()=>setActiveTool('drawmanhole')}><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="6"/></svg><span className="tp">放置检查井 (P)</span></div>
        <div className={`tb${activeTool==='measure'?' on':''}`} onClick={()=>setActiveTool('measure')}><svg viewBox="0 0 16 16"><line x1="2" y1="14" x2="14" y2="2"/><line x1="2" y1="14" x2="2" y2="10"/><line x1="2" y1="14" x2="6" y2="14"/></svg><span className="tp">测量 (M)</span></div>
      </div>
      <div className="sep"/>
      <div className="tg">
        <div className={`tb${activeTool==='traceup'?' on':''}`} onClick={()=>setActiveTool('traceup')}><svg viewBox="0 0 16 16"><path d="M8 14V4m0 0L4 8m4-4l4 4"/></svg><span className="tp">上游追踪</span></div>
        <div className={`tb${activeTool==='tracedown'?' on':''}`} onClick={()=>setActiveTool('tracedown')}><svg viewBox="0 0 16 16"><path d="M8 2v10m0 0l-4-4m4 4l4-4"/></svg><span className="tp">下游追踪</span></div>
        <div className="tb"><svg viewBox="0 0 16 16"><circle cx="8" cy="8" r="6"/><path d="M8 5v4m0 2v.5"/></svg><span className="tp">拓扑检查</span></div>
      </div>
      <div className="sep"/>
      <div className="vs">
        {(['2d','3d','profile','split'] as const).map(m=>(
          <div key={m} className={`vb${viewMode===m?' on':''}`} onClick={()=>setViewMode(m)}>{m==='2d'?'2D':m==='3d'?'3D':m==='profile'?'纵断面':'分屏'}</div>
        ))}
      </div>
      <div className="sep"/>
      <div className="cmdt" onClick={toggleCommandPalette}>
        <svg viewBox="0 0 16 16"><circle cx="7" cy="7" r="5"/><line x1="11" y1="11" x2="14" y2="14"/></svg>
        <span>搜索命令...</span><kbd>Ctrl K</kbd>
      </div>
    </div>
  );
}
