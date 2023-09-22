import { GeoPoint } from 'firebase-admin/firestore';
import { isFinite } from 'lodash-es';
import { Coordinates, Nullable } from '../common/index.js';
import { betweenRange } from './helpers.js';

export const isValidCoords = (
  val: GeoPoint | Nullable<Coordinates> | null | undefined
): val is Coordinates | GeoPoint => {
  if (!val) return false;
  const { latitude, longitude } = val;

  return isLongitude(longitude) && isLatitude(latitude);
};

export const isLongitude = (lon: unknown) =>
  !!(isFinite(lon) && betweenRange(lon as number, -180, 180));

export const isLatitude = (lat: unknown) =>
  !!(isFinite(lat) && betweenRange(lat as number, -90, 90));
