import { create } from 'zustand';
import type { LayerInfo, SelectedFeature, ViewMode } from '../types';

export interface ToastItem {
  id: string;
  type: 'success' | 'warning' | 'error';
  message: string;
}

export interface ImportFile {
  id: string;
  name: string;
  format: string;
  size: string;
  status: 'pending' | 'importing' | 'success' | 'warning' | 'error';
  progress: number;
  message?: string;
}

export type BasemapId = 'dark' | 'osm' | 'satellite' | 'terrain' | 'tdt';

export type ActiveTool = 'select' | 'boxselect' | 'drawpipe' | 'drawmanhole' | 'measure' | 'traceup' | 'tracedown';

interface AppState {
  // Layers
  layers: LayerInfo[];
  setLayerVisibility: (id: string, visible: boolean) => void;
  setLayerSelected: (id: string) => void;
  setLayerOpacity: (id: string, opacity: number) => void;
  removeLayer: (id: string) => void;
  addLayer: (layer: LayerInfo) => void;

  // Selected feature
  selectedFeature: SelectedFeature | null;
  setSelectedFeature: (feature: SelectedFeature | null) => void;

  // Multiple selection (box select)
  selectedFeatureIds: string[];
  setSelectedFeatureIds: (ids: string[]) => void;

  // View mode
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;

  // Command palette
  commandPaletteOpen: boolean;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;

  // Map state
  zoom: number;
  mouseCoords: [number, number];
  setZoom: (zoom: number) => void;
  setMouseCoords: (coords: [number, number]) => void;

  // Property panel tab
  propertyTab: 'properties' | 'dashboard' | 'history';
  setPropertyTab: (tab: 'properties' | 'dashboard' | 'history') => void;

  // Active tool
  activeTool: ActiveTool;
  setActiveTool: (tool: ActiveTool) => void;

  // Toast
  toasts: ToastItem[];
  addToast: (type: ToastItem['type'], message: string) => void;
  removeToast: (id: string) => void;

  // Wizard
  wizardOpen: boolean;
  wizardStep: number;
  setWizardOpen: (open: boolean) => void;
  setWizardStep: (step: number) => void;

  // Basemap
  basemap: BasemapId;
  setBasemap: (id: BasemapId) => void;

  // Import
  importPanelOpen: boolean;
  setImportPanelOpen: (open: boolean) => void;
  importFiles: ImportFile[];
  addImportFile: (file: ImportFile) => void;
  updateImportFile: (id: string, updates: Partial<ImportFile>) => void;
  removeImportFile: (id: string) => void;

  // Context menu
  contextMenu: { x: number; y: number; lngLat?: [number, number] } | null;
  setContextMenu: (menu: { x: number; y: number; lngLat?: [number, number] } | null) => void;

  // Box select rectangle
  boxSelectRect: { start: [number, number]; end: [number, number] } | null;
  setBoxSelectRect: (rect: { start: [number, number]; end: [number, number] } | null) => void;

  // Project info
  projectName: string;
  crs: { name: string; epsg: string };
}

let toastCounter = 0;

export const useAppStore = create<AppState>((set, get) => ({
  // Layers
  layers: [
    { id: 'pipes', name: '管段图层', color: '#4a90ff', count: 20, visible: true, selected: true, type: 'pipe', opacity: 70 },
    { id: 'manholes', name: '检查井图层', color: '#34d399', count: 15, visible: true, selected: false, type: 'manhole', opacity: 85 },
  ],
  setLayerVisibility: (id, visible) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, visible } : l)),
    })),
  setLayerSelected: (id) =>
    set((state) => ({
      layers: state.layers.map((l) => ({ ...l, selected: l.id === id })),
    })),
  setLayerOpacity: (id, opacity) =>
    set((state) => ({
      layers: state.layers.map((l) => (l.id === id ? { ...l, opacity } : l)),
    })),
  removeLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
    })),
  addLayer: (layer) =>
    set((state) => ({
      layers: [...state.layers, layer],
    })),

  // Selected feature
  selectedFeature: null,
  setSelectedFeature: (feature) => set({ selectedFeature: feature }),

  // Multiple selection
  selectedFeatureIds: [],
  setSelectedFeatureIds: (ids) => set({ selectedFeatureIds: ids }),

  // View mode
  viewMode: '2d',
  setViewMode: (mode) => set({ viewMode: mode }),

  // Command palette
  commandPaletteOpen: false,
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),

  // Map state
  zoom: 15,
  mouseCoords: [114.048, 30.529],
  setZoom: (zoom) => set({ zoom }),
  setMouseCoords: (coords) => set({ mouseCoords: coords }),

  // Property panel tab
  propertyTab: 'properties',
  setPropertyTab: (tab) => set({ propertyTab: tab }),

  // Active tool
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),

  // Toast
  toasts: [],
  addToast: (type, message) => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }));
  },
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  // Wizard
  wizardOpen: !localStorage.getItem('gispro-wizard-done'),
  wizardStep: 0,
  setWizardOpen: (open) => {
    if (!open) localStorage.setItem('gispro-wizard-done', '1');
    set({ wizardOpen: open });
  },
  setWizardStep: (step) => set({ wizardStep: step }),

  // Basemap
  basemap: 'dark',
  setBasemap: (id) => set({ basemap: id }),

  // Import
  importPanelOpen: false,
  setImportPanelOpen: (open) => set({ importPanelOpen: open }),
  importFiles: [],
  addImportFile: (file) =>
    set((s) => ({ importFiles: [...s.importFiles, file] })),
  updateImportFile: (id, updates) =>
    set((s) => ({
      importFiles: s.importFiles.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),
  removeImportFile: (id) =>
    set((s) => ({ importFiles: s.importFiles.filter((f) => f.id !== id) })),

  // Context menu
  contextMenu: null,
  setContextMenu: (menu) => set({ contextMenu: menu }),

  // Box select
  boxSelectRect: null,
  setBoxSelectRect: (rect) => set({ boxSelectRect: rect }),

  // Project info
  projectName: '南城区排水管网改造项目',
  crs: { name: 'CGCS2000 / 3° Gauss-Kruger CM 114E', epsg: '4547' },
}));
