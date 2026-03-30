import { AxiosResponse } from 'axios';
import express, { Request, Response } from 'express';

import { ProtosureFormData, SpatialKeyResponse } from '../common/index.js';
import { validateRequest } from '../middlewares/index.js';
import {
  geocodeSanitization,
  propertyDataValidation,
} from '../middlewares/validation/index.js';
import { protosure, spatialKeyInstance } from '../services/index.js';

// DELETE ?? fetches property data from spatial key -> updates property data in protosure quote

interface PropertyReqBody {
  address: {
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postal: string;
    countyName: string;
    fips: string;
  };
  coordinates: { latitude: number; longitude: number };
}

const router = express.Router();

// TODO: validation - geocode if required ?? middleware ??
// allow params indicating which default limits to include ?

router.post(
  '/property-data/:quoteId',
  geocodeSanitization,
  propertyDataValidation,
  validateRequest,
  async (req: Request, res: Response) => {
    const { quoteId } = req.params;
    const { latitude, longitude } = req.body.coordinates;
    console.log('req.body: ', req.body);

    // GET QUOTE FROM PROTOSURE - move to middleware ?? use getOrCreateQuote ??
    // const { data: quoteData } = await protosure.get<ProtosureQuoteData>(`/quotes/${quoteId}/`);
    // console.log('GET QUOTE RES: ', quoteData);
    // IF COORDINATES NOT THE SAME, RESET QUOTE
    // * OR SHOULD FORM DATA ALWAYS BE RESET ?? *

    let skRes: SpatialKeyResponse;
    try {
      let { data: propData }: AxiosResponse<SpatialKeyResponse[]> =
        await spatialKeyInstance.get(
          `/api/analytics/v3/uw/single.json?lat=${encodeURIComponent(
            latitude,
          )}&lon=${encodeURIComponent(longitude)}&shortFieldNames=true`,
        );
      skRes = propData[0];
    } catch (err) {
      // @ts-ignore
      console.log('SPATIAL KEY ERROR: ', err.response.data);
      throw err;
    }
    // TODO: skData.filter(startsWith(us_hh)).remove(us_hh)

    // EXTRACT DATA & CALCULATE DEFAULTS (RCV, limits, deductible, etc.)
    const extractedValues = extractValuesFromSKRes(skRes);
    console.log('extractedValues', extractedValues);
    let newInputData: Partial<ProtosureFormData> = mapExtractedToProtosure(
      extractedValues,
      req.body,
    );
    console.log('mapped: ', newInputData);

    try {
      const { data: updateRes } = await protosure.patch(
        `/quotes/${quoteId}/update_input_data/`,
        {
          inputData: { ...newInputData, hazardhub: skRes },
        },
      );

      res.status(200).send({ updateRes });
    } catch (err) {
      // @ts-ignore
      console.log(err.response);
      throw err;
    }
  },
);

export { router as propertyDataRouter };

// Middleware
//    - geocode if coordinates missing. reverse geocode if address is missing
//    - get county and/or FIPS if missing
// Call spatial key to get property data
//    - extract the values we care about
//    - calculate defaults (RCV, limits, etc.) -- or are they calculated be default in protosure on update ??
//    - reset protosure fields ?? what about stuff like agency, etc.
// Update input data in Protosure
// Return response from protosure (remove sensitive fields ??)

interface PropData {
  sqFootage: number | null;
  numStories: number | null;
  distToCoastFeet: number | null;
  replacementCost: number | null;
  propertyCode: string;
  yearBuilt: number | null;
  floodZone: string;
  CBRSDesignation: string;
  basement: string;
}

function extractValuesFromSKRes(spatialKeyData: SpatialKeyResponse): PropData {
  let sqFootage = parseFloat(spatialKeyData.us_hh_square_footage) || null;
  let numStories =
    parseInt(spatialKeyData.us_hh_assessment_num_stories.replace(/\D/g, '')) ||
    null;
  let replacementCost = parseInt(spatialKeyData.us_hh_replacement_cost) || null;
  let propertyCode = spatialKeyData.us_hh_property_use_code;
  let yearBuilt = parseInt(spatialKeyData.us_hh_year_built) || null;
  let floodZone = spatialKeyData.us_hh_fema_all_params_zone;
  let CBRSDesignation = spatialKeyData.us_hh_fema_cbrs_params_designation;
  let basement = spatialKeyData.us_hh_assessment_basement;
  const dtcArr = spatialKeyData.us_hh_dtc_beach_distance.split(' ');
  let distToCoastUnit = dtcArr[dtcArr.length - 1];
  let distToCoastFeet = parseInt(
    spatialKeyData.us_hh_dtc_beach_distance.replace(/\D/g, ''),
  ); // || null

  console.log(`SPATIALKEY SQ FOOTAGE: ${sqFootage}`);
  console.log(`SPATIALKEY NUM STORIES: ${numStories}`);
  console.log(`SPATIALKEY DIST 2 COAST: ${distToCoastFeet} ${distToCoastUnit}`);
  console.log(`SPATIALKEY RCV: ${replacementCost}`);
  console.log(`SPATIALKEY PROPERTY CODE: ${propertyCode}`);
  console.log(`SPATIALKEY YEAR BUILT: ${yearBuilt}`);
  console.log(`SPATIALKEY FLOOD ZONE: ${floodZone}`);
  console.log(`SPATIALKEY CBRS: ${CBRSDesignation}`);
  console.log(`SPATIALKEY BASEMENT: ${basement}`);

  // NOT QUOTABLE - DECLINE
  if (CBRSDesignation.toUpperCase() != 'OUT') {
    console.log('NOT RATABLE. CBRS DID NOT PASS. OVERRIDE FOR DEV.');
    // reject('Not ratable. Property within CBRS perimeter.');
    // return;
  }
  if (
    distToCoastUnit.toLowerCase() === 'mile' ||
    distToCoastUnit.toLowerCase() === 'miles'
  ) {
    distToCoastFeet = Math.round(5280 * distToCoastFeet);
  }

  // FORMAT MISSING VALUES
  if (basement === '') basement = 'unknown';
  if (basement === 'B') basement = 'finished';

  return {
    sqFootage,
    numStories,
    distToCoastFeet,
    replacementCost,
    propertyCode,
    yearBuilt,
    floodZone,
    CBRSDesignation,
    basement,
  };
}

// const defaultPcts = {
//   a: 1,
//   b: 0.05,
//   c: 0.25,
//   d: 0.1,
// };

function mapExtractedToProtosure(
  extractedValues: PropData,
  reqBody: PropertyReqBody,
) {
  // let rcRef = extractedValues.replacementCost;
  // if (!rcRef) rcRef = 250000;
  // rcRef = Math.min(rcRef, parseInt(process.env.FLOOD_MAX_LIMIT_A!) || 1000000);

  // const limits = {
  //   building_coverage_limit: rcRef,
  //   cov_b_limit: rcRef * defaultPcts.b,
  //   cov_c_limit: rcRef * defaultPcts.c,
  //   cov_d_limit: rcRef * defaultPcts.d,
  // };

  // // QUESTION: SHOULD RCV BE REDUCED WHEN ABOVE LIMIT
  // // ex. RCV_C = min(1.5m, 1m) * 0.25 OR 1.5m * 0.25
  // const rcvs = {
  //   cov_a_rcv_building_replacement_cost: rcRef,
  //   cov_b_rcv_unattached_dwellings_limit: rcRef ? round(rcRef * 0.05, -3) : null,
  //   cov_c_rcv_content_limit: rcRef ? round(rcRef * 0.25, -3) : null,
  //   cov_d_rcv_living_expenses_limit: rcRef ? round(rcRef * 0.1, -3) : null,
  // };

  // const tiv = Object.values(rcvs).reduce((acc, curr) => {
  //   console.log('tiv acc: ', acc);
  //   const x: number = curr || 0;
  //   return acc || 0 + x;
  // }, 0);
  // const deductible = tiv ? round(tiv * 0.01, -3) : 3000;

  // const { addressLine1, addressLine2, city, state, postal, latitude, longitude, countyName, fips } =
  //   reqBody;
  const { addressLine1, addressLine2, city, state, postal, countyName, fips } =
    reqBody.address;
  const { latitude, longitude } = reqBody.coordinates;

  const defaults = {
    assessment_hh_us_basement: extractedValues.basement,
    flood_zone_letter_only: extractedValues.floodZone.charAt(0),
    distance_to_water: extractedValues.distToCoastFeet,
    distance_to_coast: extractedValues.distToCoastFeet,
    // ...limits,
    // ...rcvs,
    // type_wtextinput_a0b9f72cac5f42108dafa0b4450baed7_20230202171321: deductible, // deductible
    risk_location_address: {
      zip: postal,
      city,
      state,
      street1: addressLine1,
      street2: addressLine2 ?? null,
      latitude,
      longitude,
      countyFips: fips,
      countyName,
    },
    county_fips: fips,
  };
  console.log(defaults);
  return defaults;
}
