import { useAppStore } from '../store';
import { useMapContext } from '../hooks/useMapContext';

export default function LayerPanel() {
  const { layers, setLayerSelected, setLayerOpacity, basemap, setImportPanelOpen } = useAppStore();
  const { toggleLayerVisibility, zoomToLayer, changeBasemap } = useMapContext();
  const basemaps = [{id:'dark',name:'暗色底图',icon:'🌑'},{id:'osm',name:'OSM 标准',icon:'🗺️'},{id:'satellite',name:'卫星影像',icon:'🛰️'},{id:'terrain',name:'地形图',icon:'⛰️'}];

  return (
    <div className="pl">
      <div className="ph"><h4>图层</h4><div className="bs"><div className="b" onClick={()=>setImportPanelOpen(true)}>+</div><div className="b">⚙</div></div></div>
      <div className="ll">
        <div className="lg">业务图层</div>
        {layers.filter(l=>l.type!=='basemap').map(layer=>(
          <div key={layer.id} className={`ly${layer.selected?' sel':''}`} onClick={()=>setLayerSelected(layer.id)}>
            <div className={`ey${layer.visible?' on':''}`} onClick={e=>{e.stopPropagation();toggleLayerVisibility(layer.id,!layer.visible);}}>{layer.visible?'✓':'○'}</div>
            <div className="dt" style={{background:layer.color}}/>
            <span className="nm">{layer.name}</span>
            <span className="cn">{layer.count}</span>
            {layer.selected && <span className="ly-btn" title="缩放至图层" onClick={e=>{e.stopPropagation();zoomToLayer(layer.id);}}>🎯</span>}
          </div>
        ))}
        {layers.find(l=>l.selected) && (
          <div className="layer-opacity">
            <span className="lo-label">透明度</span>
            <input type="range" min="0" max="100" value={layers.find(l=>l.selected)?.opacity??100} onChange={e=>{const l=layers.find(l=>l.selected);if(l)setLayerOpacity(l.id,parseInt(e.target.value));}} className="lo-slider"/>
            <span className="lo-value">{layers.find(l=>l.selected)?.opacity??100}%</span>
          </div>
        )}
        <div className="lg">底图</div>
        {basemaps.map(bm=>(
          <div key={bm.id} className={`ly${basemap===bm.id?' sel':''}`} onClick={()=>changeBasemap(bm.id)}>
            <div className="ey on" onClick={e=>e.stopPropagation()}>✓</div><div className="dt" style={{background:'#666'}}/><span className="nm">{bm.name}</span><span className="cn">—</span>
          </div>
        ))}
      </div>
      <div className="ov"><div className="ov-h">概览</div><div className="om"><svg width="100%" height="100%" viewBox="0 0 200 65"><rect width="200" height="65" fill="var(--bg)"/><polyline points="22,20 65,20 110,32 165,32" fill="none" stroke="var(--ac)" strokeWidth="1.5" opacity=".5"/><circle cx="22" cy="20" r="2" fill="var(--gn)" opacity=".5"/><circle cx="65" cy="20" r="2" fill="var(--gn)" opacity=".5"/><circle cx="110" cy="32" r="2" fill="var(--gn)" opacity=".5"/><circle cx="165" cy="32" r="2" fill="var(--gn)" opacity=".5"/></svg><div className="or" style={{left:'18%',top:'8%',width:'56%',height:'62%'}}/></div></div>
    </div>
  );
}
