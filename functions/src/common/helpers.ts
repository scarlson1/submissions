/**
 * Sums an array of numbers
 * @param {number[]} arr - array of numbers to be added.
 * @return {number} total of all numbers in array
 */
export const calcSum = (arr: number[]) => {
  return arr.reduce((total, current) => {
    return total + current;
  }, 0);
};

/**
 * Round up the the nearest x (10s, 100s, 1,000s, etc.)
 * @param {number} value - array of numbers to be added.
 * @param {number} magnitude - order of magnitude to round. Ex: 0 -> 1111; 1 -> 1110; 2 -> 1100, 3 -> 1000
 * @return {number} total of all numbers in array
 */
export const roundUpToNearest = (value: number, magnitude = 0) => {
  const factor = parseInt('1' + '0'.repeat(magnitude));
  return Math.ceil(value / factor) * factor;
};

/**
 * Round down the the nearest x (10s, 100s, 1,000s, etc.)
 * @param {number} value - array of numbers to be added.
 * @param {number} magnitude - order of magnitude to round. Ex: 0 -> 1111, 1 -> 1110; 2 -> 1100, 3 -> 1000
 * @return {number} total of all numbers in array
 */
export const roundDownToNearest = (value: number, magnitude = 0) => {
  let factor = parseInt('1' + '0'.repeat(magnitude));
  return Math.floor(value / factor) * factor;
};

/**
 * Round the the nearest x (10s, 100s, 1,000s, etc.)
 * @param {number} value - array of numbers to be added.
 * @param {number} magnitude - order of magnitude to round. Ex: 0 -> 1111, 1 -> 1110; 2 -> 1100, 3 -> 1000
 * @return {number} total of all numbers in array
 */
export const roundToNearest = (value: number, magnitude = 0) => {
  let factor = parseInt('1' + '0'.repeat(magnitude));
  return Math.round(value / factor) * factor;
};

/**
 * Round to the nearest 2 decimal places
 * @param {number} value - array of numbers to be added.
 * @return {number} total of all numbers in array
 */
export const roundDollar = (value: number) => {
  return Math.round(value * 100) / 100;
};

export const isLongitude = (num: number) => isFinite(num) && Math.abs(num) <= 180;
export const isLatitude = (num: number) => isFinite(num) && Math.abs(num) <= 90;

/**
 * The latitude must be a number between -90 and 90 and the longitude between -180 and 180.
 * @param {number} lat - latitude
 * @param {number} lng - longitude
 * @return {boolean} boolean value, true if coords are valid
 */
export const isLatLng = (lat: number, lng: number) => {
  return isLatitude(lat) && isLongitude(lng);
};
