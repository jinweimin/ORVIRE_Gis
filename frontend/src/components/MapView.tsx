import { useRef } from 'react';
import { useMap } from '../hooks/useMap';
import { MapContext } from '../hooks/useMapContext';
import Dashboard from './Dashboard';
import BoxSelectOverlay from './BoxSelectOverlay';

export default function MapView() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapCtx = useMap(mapContainerRef);
  return (
    <MapContext.Provider value={mapCtx}>
      <div className="center">
        <Dashboard />
        <div className="ma" style={{position:'relative'}}>
          <div ref={mapContainerRef} style={{width:'100%',height:'100%'}}/>
          <BoxSelectOverlay map={mapCtx.map}/>
        </div>
      </div>
    </MapContext.Provider>
  );
}
