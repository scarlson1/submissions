import axios from 'axios';
import { Address, Coordinates, OptionalKeys } from '../common/index.js';
import { isValidCoords } from '../utils/validateCoords.js';

interface GeocodeResult {
  coordinates: Coordinates;
  placeId: string | null;
  result: Record<string, any>;
}

export async function geocodeAddress(
  apiKey: string,
  { addressLine1, city, state, postal }: OptionalKeys<Address, 'addressLine2'>
): Promise<GeocodeResult> {
  // let url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${longitude}%2C${latitude}&geometryType=esriGeometryPoint&outFields=FLD_ZONE&returnGeometry=false&outSR=4326&f=json`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?parameters=${encodeURIComponent(
    `${addressLine1} ${city} ${state} ${postal}`
  )}&API_KEY=${apiKey}`;

  let { data } = await axios.get(url);

  const firstResult = data?.results ? data.results[0] : null;
  const coordinates = {
    latitude: firstResult?.geometry?.location?.lat || null,
    longitude: firstResult?.geometry?.location?.lng || null,
  };
  const placeId = firstResult.place_id || null;

  if (!isValidCoords(coordinates)) throw new Error('geocode result not found');

  return {
    coordinates,
    placeId,
    ...data,
  };
}
