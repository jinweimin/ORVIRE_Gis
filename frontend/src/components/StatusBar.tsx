import { useAppStore } from '../store';

const TOOL_LABELS: Record<string, string> = {
  select: '选择', boxselect: '框选', drawpipe: '绘制管段',
  drawmanhole: '放置检查井', measure: '测量', traceup: '上游追踪', tracedown: '下游追踪',
};

export default function StatusBar() {
  const { zoom, mouseCoords, layers, activeTool, crs } = useAppStore();
  const totalFeatures = layers.reduce((s, l) => s + l.count, 0);
  const tileLevel = Math.round(zoom);

  return (
    <div className="sb">
      <span className="sd" />
      <span>就绪</span>
      <span className="ss" />
      <span>工具: {TOOL_LABELS[activeTool] || '选择'}</span>
      <span className="ss" />
      <span>图层: {layers.length}</span>
      <span className="ss" />
      <span>{totalFeatures} 要素</span>
      <span className="ss" />
      <span>{crs.name} / EPSG:{crs.epsg}</span>
      <span className="ss" />
      <span>z={tileLevel}</span>
      <span className="sc">
        {mouseCoords[0].toFixed(4)}, {mouseCoords[1].toFixed(4)}
      </span>
    </div>
  );
}
