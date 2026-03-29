import axios from 'axios';
import { checkSchema, CustomSanitizer, CustomValidator } from 'express-validator';

import { findAddressValueByType, getByCountyAndState, getByFipsAndState } from '../../lib/index.js';
import { getSecret } from '../../config/secret-manager.js';

export const fipsOrCountyValiator: CustomValidator = (value, { req, location, path }) => {
  const county = req.body.address?.countyName;
  const state = req.body.address?.state;
  const fips = req.body.address?.fips;

  if (Boolean(county && state) || Boolean(fips)) {
    return Promise.resolve();
  }
  throw new Error('Missing countyName/state or fips');
};

export const getFIPSSanatizer: CustomSanitizer = (value: any, { req }) => {
  let sanitizedValue;
  const { countyName, state } = req.body.address;

  if (countyName && state) {
    const match = getByCountyAndState(countyName, state);
    sanitizedValue = match ? match.fips : null;
  } else {
    sanitizedValue = null;
  }
  console.log('FIPS SANITIZED VALUE: ', sanitizedValue);
  return sanitizedValue;
};

export const geocodeSanatizer: CustomSanitizer = async (value: any, { req, location, path }) => {
  if (value && value.latitude && value.longitude) {
    return value;
  }
  if (!req.body.address) {
    return value;
  }
  const googleGeoKey = (await getSecret('GOOGLE_BACKEND_GEO_KEY')) as string;
  let coords = { latitude: value?.latitude || null, longitude: value?.longitude || null };

  const { addressLine1, city, state, postal } = req.body.address;

  const encodedAddress = encodeURIComponent(`${addressLine1} ${city}, ${state} ${postal}`);

  const { data } = await axios.get(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${googleGeoKey}`
  );

  const result = data.results[0];
  console.log('GEOCODE RESULT: ', result);
  if (result && result.geometry) {
    const { lat, lng } = result.geometry.location;

    coords = { latitude: lat, longitude: lng };
  }
  console.log('COORDS: ', coords);
  return coords;
};

export const reverseGeocodeSanatizer: CustomSanitizer = async (value: any, { req }) => {
  const { addressLine1, city, state, postal } = value || {};
  const { coordinates } = req.body;

  // IF MISSING ADDRESS, AND COORDS INCLUDED => REVERSE GEOCODE
  if (
    !(addressLine1 && city && state && postal) &&
    coordinates?.latitude &&
    coordinates?.longitude
  ) {
    // if address and not coords, continue
    const googleGeoKey = (await getSecret('GOOGLE_BACKEND_GEO_KEY')) as string;

    // REVERSE GEOCODE
    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&result_type=street_address&key=${googleGeoKey}`
    );

    const { address_components } = data.results[0];

    // GET ADDRESS
    const newStreetNumber = findAddressValueByType(address_components, 'street_number');
    const newStreetName = findAddressValueByType(address_components, 'route');
    const newCity = findAddressValueByType(address_components, 'locality');
    const newCounty = findAddressValueByType(address_components, 'administrative_area_level_2');
    const newState = findAddressValueByType(address_components, 'administrative_area_level_1');
    const newPostal = findAddressValueByType(address_components, 'postal_code');

    // SET ADDRESS IN BODY

    const updatedValue = {
      addressLine1: `${newStreetNumber?.long_name || ''} ${newStreetName?.long_name || ''}`.trim(),
      city: `${newCity?.long_name || ''}`,
      countyName: `${newCounty?.long_name || ''}`,
      state: `${newState?.short_name || ''}`,
      postal: `${newPostal?.long_name || ''}`,
    };
    console.log('updated value: ', updatedValue);
    return updatedValue;
  }
  return value;
};

export const getCountyName: CustomSanitizer = async (value: any, { req }) => {
  const { addressLine1, city, state, postal, fips } = req.body.address || {};
  const { coordinates } = req.body;

  if (state && fips) {
    try {
      console.log(`searching ${fips} | ${state}`);
      const fipsMatch = getByFipsAndState(fips, state);
      console.log('STATE/FIPS MATCH: ', fipsMatch);
      if (fipsMatch && fipsMatch.county) return fipsMatch.county;
    } catch (err) {
      console.log('Failed to find county name by fips/state. Require geocoding', err);
    }
  }

  // IF MISSING ADDRESS, AND COORDS INCLUDED => REVERSE GEOCODE
  if (
    !(addressLine1 && city && state && postal) &&
    coordinates?.latitude &&
    coordinates?.longitude
  ) {
    // if address and not coords, continue
    const googleGeoKey = (await getSecret('GOOGLE_BACKEND_GEO_KEY')) as string;

    // REVERSE GEOCODE
    const { data } = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&result_type=street_address&key=${googleGeoKey}`
    );

    const { address_components } = data.results[0];
    const newCounty = findAddressValueByType(address_components, 'administrative_area_level_2');
    return `${newCounty?.long_name || ''}`;
  }
  return value;
};

export const geocodeSanitization = checkSchema({
  coordinates: {
    in: ['body'],
    customSanitizer: {
      options: geocodeSanatizer,
    },
    errorMessage: 'geocode error',
  },
  address: {
    in: ['body'],
    customSanitizer: {
      options: reverseGeocodeSanatizer,
    },
    errorMessage: 'reverse geocode error',
  },
});

export const propertyDataValidation = checkSchema({
  quoteId: {
    in: ['params'],
    notEmpty: true,
    errorMessage: 'quoteId required in params ( /property-data/{quoteId} )',
  },
  'address.addressLine1': {
    in: ['body'],
    notEmpty: true,
    errorMessage: 'addressLine1 required in body of request',
  },
  'address.addressLine2': {
    in: ['body'],
    // notEmpty: true,
    // errorMessage: 'addressLine2 required in body of request',
  },
  'address.city': {
    in: ['body'],
    notEmpty: true,
    errorMessage: 'city required in body of request',
  },
  'address.state': {
    in: ['body'],
    // notEmpty: true,
    isLength: {
      errorMessage: 'state must be 2 letter abbreviation',
      options: { min: 2, max: 2 },
    },
    toUpperCase: true,
    errorMessage: 'state required in body of request (2 letter abbreviation)',
  },
  'address.postal': {
    in: ['body'],
    // notEmpty: true,
    isPostalCode: {
      options: 'US',
    },
    errorMessage: 'postal required in body of request',
  },
  'address.countyName': {
    in: ['body'],
    customSanitizer: {
      options: getCountyName,
    },
    errorMessage: 'countyName or fips required in body of request',
  },
  'address.fips': {
    in: ['body'],
    customSanitizer: {
      options: getFIPSSanatizer,
    },
    // notEmpty: true,
    // isLength: {
    //   errorMessage: 'fips should be 5 characters',
    //   options: { min: 5, max: 5 },
    // },
    errorMessage: 'must provide fips or countyName and state',
  },
  'coordinates.latitude': {
    in: ['body'],
    notEmpty: true,
    toFloat: true,
    errorMessage: 'latitude required in body of request',
  },
  'coordinates.longitude': {
    in: ['body'],
    notEmpty: true,
    toFloat: true,
    errorMessage: 'longitude required in body of request',
  },
});
