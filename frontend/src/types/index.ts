import type { Feature, GeoJsonProperties, Geometry } from 'geojson';

export interface PipeProperties {
  pipe_id: string;
  upstream_mh: string;
  downstream_mh: string;
  diameter: number;
  material: string;
  pipe_type: string;
  length: number;
  slope: number;
  install_date?: string;
  defect_grade?: string;
}

export interface ManholeProperties {
  mh_id: string;
  depth: number;
  mh_type: string;
  cover_level: number;
  invert_level: number;
  install_date?: string;
}

export type PipeFeature = Feature<Geometry, PipeProperties>;
export type ManholeFeature = Feature<Geometry, ManholeProperties>;

export interface LayerInfo {
  id: string;
  name: string;
  color: string;
  count: number;
  visible: boolean;
  selected: boolean;
  type: 'pipe' | 'manhole' | 'basemap' | 'vector';
  opacity?: number;
  dataSource?: string;
}

export interface SelectedFeature {
  type: 'pipe' | 'manhole';
  properties: Record<string, unknown>;
}

export type ViewMode = '2d' | '3d' | 'profile' | 'split';

export interface Command {
  id: string;
  label: string;
  icon: string;
  shortcut?: string;
  action: () => void;
  category: string;
}
