import { createContext, useContext, type RefObject } from 'react';
import type maplibregl from 'maplibre-gl';
import type { BasemapId } from '../store';

interface MapContextType {
  map: RefObject<maplibregl.Map | null>;
  mapReady: boolean;
  toggleLayerVisibility: (layerId: string, visible: boolean) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToExtent: () => void;
  zoomToLayer: (layerId: string) => void;
  zoomToSelected: () => void;
  changeBasemap: (basemapId: string) => void;
  switchBasemap: (basemapId: BasemapId) => void;
  startBoxSelect: () => void;
}

export const MapContext = createContext<MapContextType>({
  map: { current: null },
  mapReady: false,
  toggleLayerVisibility: () => {},
  setLayerOpacity: () => {},
  zoomIn: () => {},
  zoomOut: () => {},
  zoomToExtent: () => {},
  zoomToLayer: () => {},
  zoomToSelected: () => {},
  changeBasemap: () => {},
  switchBasemap: () => {},
  startBoxSelect: () => {},
});

export const useMapContext = () => useContext(MapContext);
