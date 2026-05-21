import { useRef, useCallback } from 'react';
import { useAppStore } from '../store';
import type maplibregl from 'maplibre-gl';

interface Props {
  map: React.MutableRefObject<maplibregl.Map | null>;
}

export default function BoxSelectOverlay({ map }: Props) {
  const { activeTool, setSelectedFeatureIds, setActiveTool, addToast } = useAppStore();
  const startRef = useRef<[number, number] | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const drawing = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (activeTool !== 'boxselect') return;
    drawing.current = true;
    startRef.current = [e.nativeEvent.offsetX, e.nativeEvent.offsetY];
    if (boxRef.current) {
      boxRef.current.style.display = 'block';
      boxRef.current.style.left = e.nativeEvent.offsetX + 'px';
      boxRef.current.style.top = e.nativeEvent.offsetY + 'px';
      boxRef.current.style.width = '0px';
      boxRef.current.style.height = '0px';
    }
  }, [activeTool]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drawing.current || !startRef.current || !boxRef.current) return;
    const [sx, sy] = startRef.current;
    const ex = e.nativeEvent.offsetX;
    const ey = e.nativeEvent.offsetY;
    boxRef.current.style.left = Math.min(sx, ex) + 'px';
    boxRef.current.style.top = Math.min(sy, ey) + 'px';
    boxRef.current.style.width = Math.abs(ex - sx) + 'px';
    boxRef.current.style.height = Math.abs(ey - sy) + 'px';
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!drawing.current || !startRef.current || !map.current) return;
    drawing.current = false;
    const [sx, sy] = startRef.current;
    const ex = e.nativeEvent.offsetX;
    const ey = e.nativeEvent.offsetY;

    if (boxRef.current) boxRef.current.style.display = 'none';

    if (Math.abs(ex - sx) < 5 || Math.abs(ey - sy) < 5) return;

    const m = map.current;
    const features = m.queryRenderedFeatures(
      [Math.min(sx, ex), Math.min(sy, ey), Math.max(sx, ex), Math.max(sy, ey)] as any,
      { layers: ['pipes-line', 'manholes-circle'] }
    );

    const ids = features.map(f => f.properties?.pipe_id || f.properties?.mh_id).filter(Boolean) as string[];
    setSelectedFeatureIds(ids);
    addToast('success', `已选中 ${ids.length} 个要素`);
    setActiveTool('select');
  }, [map, setSelectedFeatureIds, setActiveTool, addToast]);

  if (activeTool !== 'boxselect') return null;

  return (
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 5, cursor: 'crosshair' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div
        ref={boxRef}
        style={{
          position: 'absolute',
          border: '2px solid #4a90ff',
          background: 'rgba(74,144,255,0.1)',
          pointerEvents: 'none',
          display: 'none',
        }}
      />
    </div>
  );
}
