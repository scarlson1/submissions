import { CSSProperties } from 'react';
import { max, min, zip } from 'lodash';
import { GeoPoint } from 'firebase/firestore';
import { PickingInfo } from 'deck.gl/typed';

// If using svg icon --> data url for IconLayer
export const getPlaceMarker = (color: CSSProperties['color'] = '#000000') =>
  `<svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 0 24 24" width="36px" fill="${color}"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;

export function svgToDataURL(svg: any) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// If using texture map for IconLayer
export const MAP_ICON_URL = 'https://scarlson1.github.io/icon-atlas.png';

export const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, anchorY: 128, mask: true },
};

export function getBoundingBox(points: number[][]) {
  const [xCoords, yCoords] = zip(...points);
  // format: [minLng, minLat, maxLng, maxLat]
  return [min(yCoords) || -180, min(xCoords) || -90, max(yCoords) || 180, max(xCoords) || 90];
}

export type CoordObj = Record<string, any> & {
  coordinates: GeoPoint | { latitude: number; longitude: number };
};

export interface TypedPickingInfo<T = any> extends PickingInfo {
  object?: T;
}
