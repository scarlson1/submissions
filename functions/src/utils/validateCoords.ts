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

// export const isLongitude = (num: number) => isFinite(num) && Math.abs(num) <= 180;
// export const isLatitude = (num: number) => isFinite(num) && Math.abs(num) <= 90;

// /**
//  * The latitude must be a number between -90 and 90 and the longitude between -180 and 180.
//  * @param {number} lat - latitude
//  * @param {number} lng - longitude
//  * @returns {boolean} boolean value, true if coords are valid
//  */
// export const isLatLng = (lat: number, lng: number) => {
//   return isLatitude(lat) && isLongitude(lng);
// };
