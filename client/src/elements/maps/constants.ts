import { GeoJsonLayerProps, MapViewState } from 'deck.gl';

export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export const DEFAULT_INITIAL_VIEW_STATE: MapViewState = {
  longitude: -94.25,
  latitude: 38.25,
  zoom: 3.5,
  maxZoom: 18,
  minZoom: 3,
  pitch: 0,
  bearing: 0,
};

export const defaultGeoJsonLayerProps: Partial<GeoJsonLayerProps> = {
  pickable: true,
  stroked: true,
  filled: true,
  extruded: true,
  lineWidthScale: 20,
  lineWidthMinPixels: 2,
  autoHighlight: true,
  wireframe: true,
  highlightColor: [80, 144, 211, 20],
  getLineColor: [178, 186, 194, 200],
  getFillColor: [255, 255, 255, 20],
  getPointRadius: 100,
  getLineWidth: 10,
};
