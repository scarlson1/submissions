import type { Coords } from '@idemand/common';
import axios from 'axios';
import { GeoPoint } from 'firebase-admin/firestore';
import { error } from 'firebase-functions/logger';

// API: https://www.gpxz.io/docs

const elevationBaseUrl = 'https://api.gpxz.io/v1/elevation';

export const getElevationInstance = (apiKey: string) => {
  const submissionsInstance = axios.create({
    baseURL: elevationBaseUrl,
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
    },
  });

  submissionsInstance.interceptors.response.use(
    (res) => res,
    async (err) => {
      error('gpxz elevation api error: ', err);
      return Promise.reject(err);
    },
  );

  return submissionsInstance;
};

export interface ElevationResult {
  elevation: number;
  lat: number;
  lon: number;
  data_source: string;
  resolution: number;
}

export interface ElevationRes {
  result: ElevationResult;
  status: string;
}

export interface ElevationsRes {
  results: ElevationResult[];
  status: string;
}

export function getElevation(apiKey: string, coordinates: Coords | GeoPoint) {
  const elevationClient = getElevationInstance(apiKey);

  return elevationClient
    .get<ElevationRes>('/point', {
      params: {
        lat: coordinates.latitude,
        lon: coordinates.longitude,
      },
    })
    .then(({ data }) => data?.result);
}

// query format: latlons=46.66,14.03|46.60,14.15
export function getElevations(
  apiKey: string,
  coordinates: (Coords | GeoPoint)[],
) {
  const elevationClient = getElevationInstance(apiKey);
  const latlons = coordinates
    .map((coords) => `${coords.latitude},${coords.longitude}`)
    .join('|');

  return elevationClient
    .get<ElevationsRes>('/points', {
      params: {
        latlons,
      },
    })
    .then(({ data }) => data?.results);
}
