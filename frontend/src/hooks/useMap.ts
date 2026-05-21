import { useEffect, useRef, useCallback, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useAppStore } from '../store';
import { setGlobalMapRef } from './useKeyboard';
import type { BasemapId } from '../store';

// @ts-ignore
import pipesUrl from '../data/pipes.geojson?url';
// @ts-ignore
import manholesUrl from '../data/manholes.geojson?url';

const BASEMAP_CONFIG: Record<BasemapId, { tiles: string[]; attribution: string }> = {
  dark: {
    tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png', 'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
    attribution: '&copy; CARTO',
  },
  osm: {
    tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],
    attribution: '&copy; OpenStreetMap',
  },
  satellite: {
    tiles: ['https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}@2x.png'],
    attribution: '&copy; CARTO',
  },
  terrain: {
    tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
    attribution: '&copy; CARTO',
  },
  tdt: {
    tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
    attribution: '&copy; CARTO',
  },
};

export function useMap(containerRef: React.RefObject<HTMLDivElement | null>) {
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const { setZoom, setMouseCoords, setSelectedFeature, basemap } = useAppStore();

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;
    const cfg = BASEMAP_CONFIG[basemap] || BASEMAP_CONFIG.dark;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'basemap-tiles': { type: 'raster', tiles: cfg.tiles, tileSize: 256, attribution: cfg.attribution },
        },
        layers: [{ id: 'basemap-tiles', type: 'raster', source: 'basemap-tiles', minzoom: 0, maxzoom: 22 }],
      },
      center: [114.048, 30.529],
      zoom: 15,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      // Pipes
      map.addSource('pipes', { type: 'geojson', data: pipesUrl });
      map.addLayer({ id: 'pipes-line', type: 'line', source: 'pipes', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#4a90ff', 'line-width': 4, 'line-opacity': 0.7 } });
      map.addLayer({ id: 'pipes-highlight', type: 'line', source: 'pipes', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 6, 'line-opacity': 0.5 }, filter: ['==', 'pipe_id', ''] });
      map.addLayer({ id: 'pipes-label', type: 'symbol', source: 'pipes', layout: { 'text-field': ['get', 'pipe_id'], 'text-size': 9, 'text-offset': [0, -1], 'text-anchor': 'bottom' }, paint: { 'text-color': '#6e6e90', 'text-halo-color': '#080810', 'text-halo-width': 1.5 } });

      // Manholes
      map.addSource('manholes', { type: 'geojson', data: manholesUrl });
      map.addLayer({ id: 'manholes-circle', type: 'circle', source: 'manholes', paint: { 'circle-color': '#34d399', 'circle-radius': 7, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 2, 'circle-opacity': 0.85 } });
      map.addLayer({ id: 'manholes-highlight', type: 'circle', source: 'manholes', paint: { 'circle-color': '#ffffff', 'circle-radius': 10, 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3, 'circle-opacity': 0.4 }, filter: ['==', 'mh_id', ''] });
      map.addLayer({ id: 'manholes-label', type: 'symbol', source: 'manholes', layout: { 'text-field': ['get', 'mh_id'], 'text-size': 10, 'text-offset': [0, -1.5], 'text-anchor': 'bottom' }, paint: { 'text-color': '#9c9cb8', 'text-halo-color': '#080810', 'text-halo-width': 1.5 } });

      setMapReady(true);
    });

    map.on('click', 'pipes-line', (e) => {
      if (e.features?.length) {
        const f = e.features[0];
        setSelectedFeature({ type: 'pipe', properties: f.properties as Record<string, unknown> });
        map.setFilter('pipes-highlight', ['==', ['get', 'pipe_id'], f.properties?.pipe_id || '']);
        map.setFilter('manholes-highlight', ['==', ['get', 'mh_id'], '']);
      }
    });

    map.on('click', 'manholes-circle', (e) => {
      if (e.features?.length) {
        const f = e.features[0];
        setSelectedFeature({ type: 'manhole', properties: f.properties as Record<string, unknown> });
        map.setFilter('manholes-highlight', ['==', ['get', 'mh_id'], f.properties?.mh_id || '']);
        map.setFilter('pipes-highlight', ['==', ['get', 'pipe_id'], '']);
      }
    });

    map.on('click', (e) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['pipes-line', 'manholes-circle'] });
      if (!features.length) {
        setSelectedFeature(null);
        map.setFilter('pipes-highlight', ['==', ['get', 'pipe_id'], '']);
        map.setFilter('manholes-highlight', ['==', ['get', 'mh_id'], '']);
      }
    });

    map.on('contextmenu', (e) => {
      e.preventDefault();
      const features = map.queryRenderedFeatures(e.point, { layers: ['pipes-line', 'manholes-circle'] });
      if (features.length) {
        const f = features[0];
        setSelectedFeature({ type: f.layer.id.includes('pipe') ? 'pipe' : 'manhole', properties: f.properties as Record<string, unknown> });
      }
      useAppStore.getState().setContextMenu({ x: e.point.x, y: e.point.y, lngLat: [e.lngLat.lng, e.lngLat.lat] });
    });

    map.on('mouseenter', 'pipes-line', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'pipes-line', () => { map.getCanvas().style.cursor = ''; });
    map.on('mouseenter', 'manholes-circle', () => { map.getCanvas().style.cursor = 'pointer'; });
    map.on('mouseleave', 'manholes-circle', () => { map.getCanvas().style.cursor = ''; });
    map.on('zoom', () => setZoom(Math.round(map.getZoom() * 100) / 100));
    map.on('mousemove', (e) => { setMouseCoords([Math.round(e.lngLat.lng * 10000) / 10000, Math.round(e.lngLat.lat * 10000) / 10000]); });

    mapRef.current = map;
    setGlobalMapRef(map);
  }, [containerRef, setZoom, setMouseCoords, setSelectedFeature, basemap]);

  useEffect(() => {
    initMap();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; setGlobalMapRef(null); } };
  }, [initMap]);

  const toggleLayerVisibility = useCallback((layerId: string, visible: boolean) => {
    const map = mapRef.current;
    if (!map) return;
    const vis = visible ? 'visible' : 'none';
    if (layerId === 'pipes') ['pipes-line', 'pipes-highlight', 'pipes-label'].forEach(l => map.setLayoutProperty(l, 'visibility', vis));
    else if (layerId === 'manholes') ['manholes-circle', 'manholes-highlight', 'manholes-label'].forEach(l => map.setLayoutProperty(l, 'visibility', vis));
    useAppStore.getState().setLayerVisibility(layerId, visible);
  }, []);

  const zoomToExtent = useCallback(() => { mapRef.current?.fitBounds([[114.043, 30.527], [114.054, 30.531]], { padding: 50 }); }, []);

  const zoomToLayer = useCallback((layerId: string) => {
    const map = mapRef.current;
    if (!map) return;
    zoomToExtent();
  }, [zoomToExtent]);

  const zoomToSelected = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const sf = useAppStore.getState().selectedFeature;
    if (!sf) return;
    const id = String(sf.type === 'pipe' ? sf.properties.pipe_id : sf.properties.mh_id || '');
    const filterKey = sf.type === 'pipe' ? 'pipe_id' : 'mh_id';
    map.setFilter(sf.type === 'pipe' ? 'pipes-highlight' : 'manholes-highlight', ['==', ['get', filterKey], id]);
    map.zoomTo(17);
  }, []);

  const changeBasemap = useCallback((basemapId: string) => {
    const map = mapRef.current;
    if (!map) return;
    const cfg = BASEMAP_CONFIG[basemapId as BasemapId];
    if (!cfg) return;
    const source = map.getSource('basemap-tiles') as any;
    if (source?.setTiles) source.setTiles(cfg.tiles);
    useAppStore.getState().setBasemap(basemapId as BasemapId);
  }, []);

  const startBoxSelect = useCallback(() => { useAppStore.getState().setActiveTool('boxselect'); }, []);

  const zoomIn = useCallback(() => { mapRef.current?.zoomIn({ duration: 300 }); }, []);
  const zoomOut = useCallback(() => { mapRef.current?.zoomOut({ duration: 300 }); }, []);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    const map = mapRef.current;
    if (!map) return;
    const o = opacity / 100;
    if (layerId === 'pipes') {
      map.setPaintProperty('pipes-line', 'line-opacity', o);
    } else if (layerId === 'manholes') {
      map.setPaintProperty('manholes-circle', 'circle-opacity', o);
      map.setPaintProperty('manholes-label', 'text-opacity', o);
    }
    useAppStore.getState().setLayerOpacity(layerId, opacity);
  }, []);

  const switchBasemap = useCallback((basemapId: BasemapId) => {
    const map = mapRef.current;
    if (!map) return;
    const cfg = BASEMAP_CONFIG[basemapId];
    if (!cfg) return;
    const source = map.getSource('basemap-tiles') as any;
    if (source?.setTiles) source.setTiles(cfg.tiles);
    useAppStore.getState().setBasemap(basemapId);
  }, []);

  return { map: mapRef, mapReady, toggleLayerVisibility, setLayerOpacity, zoomIn, zoomOut, zoomToExtent, zoomToLayer, zoomToSelected, changeBasemap, switchBasemap, startBoxSelect };
}
