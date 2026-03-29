import express, { Request, Response } from 'express';
// import { NotFoundError } from '../errors/not-found-error.js';
// import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getFirestore, GeoPoint } from 'firebase-admin/firestore';
import { AxiosResponse } from 'axios';

import { updateQuoteValidation } from '../middlewares/validation/index.js';
import { validateRequest } from '../middlewares/index.js';
import { protosure, spatialKeyInstance, swissReInstance } from '../services/index.js';
import { swissReBody, SwissReBodyParams } from '../lib/swiss-re-body-template.js';
import { ProtosureQuoteData, SpatialKeyResponse, swissReResCollection } from '../common/index.js';
import { getByCountyAndState } from '../lib/getFIPS.js';

const router = express.Router();

// TODO:
//  - separate out update quote and rate quote
//    - update quote updates input values, calls spatial key if required
//    - calc rater only does calculation ??

//   calcQuote: 3073 => 3 seconds
//   getQuote: 346 =>  0.3 seconds
//   getSK: 2270 =>  2.2 seconds
//   getSR: 3162 => 3.1 seconds
//   setSRDoc: 137 =>  0.1 second
//   updateQuote: 580 => 0.5 seconds

// calcQuote: 2306;
// getFIPS: 3;
// getQuote: 340;
// getSK: 2080;
// getSR: 2938;
// setSRDoc: 82;
// updateQuote: 547;

// calcQuote: 2047;
// getFIPS: 1;
// getQuote: 300;
// getSK: 1854;
// getSR: 3143;
// setSRDoc: 45;
// updateQuote: 482;

// calcQuote: 2284;
// getFIPS: 5;
// getQuote: 349;
// getSK: 2397; (945 ms for auth token)
// getSR: 4135; (1019 ms for auth token)
// setSRDoc: 100;
// updateQuote: 433;

router.post(
  '/update-quote/:quoteId',
  updateQuoteValidation,
  validateRequest,
  // TODO: middleware to get user details
  async (req: Request, res: Response) => {
    const timers: any = {
      getQuote: {},
      getFIPS: {},
      getSK: {},
      getSR: {},
      setSRDoc: {},
      updateQuote: {},
      calcQuote: {},
    };
    const { quoteId } = req.params;
    const clientValues = req.body;
    console.log('QUOTE ID: ', quoteId);
    console.log('VALUES: ', clientValues);

    const db = getFirestore();

    // GET QUOTE FROM PROTOSURE
    // let quoteData;
    timers.getQuote.start = new Date().getTime();
    const { data: quoteData } = await protosure.get<ProtosureQuoteData>(`/quotes/${quoteId}/`);
    timers.getQuote.end = new Date().getTime();
    // IF COORDS NOT THE SAME, NEED TO RESET QUOTE
    //    - rerun SK & SR api calls, lookup county fips,
    //    - fields: update insured address location, updating property data, AALs

    // TODO: IF COORDS OR COUNTY NOT PRESENT, NEED TO GEOCODE ADDRESS (if user didn't use autocomplete)
    // IF COUNTY FIPS NOT PRESENT, NEED TO LOOK UP FIPS
    console.log('GET QUOTE RES: ', quoteData);
    let county_fips = quoteData.formData.county_fips;
    if (clientValues.countyName && clientValues.state && !county_fips) {
      timers.getFIPS.start = new Date().getTime();
      const fipsSearch = getByCountyAndState(clientValues.countyName, clientValues.state);
      console.log('FIPS SEARCH RESULT: ', fipsSearch);
      timers.getFIPS.end = new Date().getTime();
      if (fipsSearch) county_fips = fipsSearch.fips;
    }

    // DETERMINE IF CALL TO HH / SPATIALKEY IS REQUIRED (move to separate call ??) TODO: reset protosure form
    //    - move to separate call - can prompt for missing values if needed ??
    const shouldCallSK = checkPropertyDataCallRequired(clientValues, quoteData);
    console.log('SHOULD CALL SPATIAL KEY: ', shouldCallSK);
    let propertyDataUpdates: any = {};
    if (shouldCallSK) {
      // call sk && extract data and add to propertyDataUpdates
      timers.getSK.start = new Date().getTime();
      let { data: propResData }: AxiosResponse<SpatialKeyResponse[]> = await spatialKeyInstance.get(
        `/api/analytics/v3/uw/single.json?lat=${encodeURIComponent(
          clientValues.latitude
        )}&lon=${encodeURIComponent(clientValues.longitude)}&shortFieldNames=true`
      );
      timers.getSK.end = new Date().getTime();

      const extractedValues = extractValuesFromSKRes(propResData[0]);
      propertyDataUpdates = mapExtractedToProtosure(extractedValues);
      // TODO: get default limits
      // TEMPORARY WORKAROUND
      propertyDataUpdates.cov_a_rcv_building_replacement_cost = Math.min(
        extractedValues.replacementCost || 500000,
        1000000
      );
      propertyDataUpdates.cov_b_rcv_unattached_dwellings_limit = Math.min(
        (extractedValues.replacementCost || 500000) * 0.05,
        1000000
      );
      propertyDataUpdates.cov_c_rcv_content_limit = Math.min(
        (extractedValues.replacementCost || 500000) * 0.25,
        1000000
      );
      propertyDataUpdates.cov_d_rcv_living_expenses_limit = Math.min(
        (extractedValues.replacementCost || 500000) * 0.1,
        1000000
      );
      if (!clientValues.limitA || clientValues.limitA === '') {
        clientValues.limitA = propertyDataUpdates.cov_a_rcv_building_replacement_cost;
        clientValues.limitB = propertyDataUpdates.cov_b_rcv_unattached_dwellings_limit;
        clientValues.limitC = propertyDataUpdates.cov_c_rcv_content_limit;
        clientValues.limitD = propertyDataUpdates.cov_d_rcv_living_expenses_limit;
      }
      // TODO: save spatial key data to database ??
    }

    // DETERMINE IF FIELDS CHANGED THAT REQUIRE CALLING SR
    //  - coords limits, RCV?, numStories, deductible
    const shouldCallSR = checkSRCallRequired(clientValues, quoteData);
    console.log('SHOULD MAKE API CALLS: ', shouldCallSK, shouldCallSR);
    const rcvRef =
      propertyDataUpdates.cov_a_rcv_building_replacement_cost ||
      quoteData.formData.cov_a_rcv_building_replacement_cost;

    let ratingUpdates: any = {};

    const xmlBodyVars: SwissReBodyParams = getXMLBodyVars(clientValues, rcvRef); // TODO: DETERMINE SOURCE OF VALUES (client ??)
    if (shouldCallSR) {
      console.log('SR BODY VARS: ', xmlBodyVars);
      timers.getSR.start = new Date().getTime();
      const body = swissReBody(xmlBodyVars);
      const { data } = await swissReInstance.post('/rate/sync/srxplus/losses', body, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
      });
      timers.getSR.end = new Date().getTime();
      console.log('SWISS RE RES: ', data);

      let code200Index = data.expectedLosses.findIndex(
        (floodObj: any) => floodObj.perilCode === '200'
      );
      let code300Index = data.expectedLosses.findIndex(
        (floodObj: any) => floodObj.perilCode === '300'
      );

      if (code200Index !== -1) {
        let { preCatLoss: surgeAAL } = data.expectedLosses[code200Index];
        ratingUpdates.aal_storm_surge = surgeAAL ?? 0;
      } else {
        ratingUpdates.aal_storm_surge = 0;
      }

      if (code300Index !== -1) {
        let { preCatLoss: inlandAAL } = data.expectedLosses[code300Index];
        ratingUpdates.aal_inland_flood = inlandAAL ?? 0;
      } else {
        ratingUpdates.aal_inland_flood = 0;
      }
      timers.setSRDoc.start = new Date().getTime();
      const swissReRef = await swissReResCollection(db).add({
        ...data,
        ...ratingUpdates,
        submissionId: quoteId,
        address: {
          addressLine1: clientValues.addressLine1,
          addressLine2: clientValues.addressLine2,
          city: clientValues.city,
          state: clientValues.state,
          postal: clientValues.postal,
        },
        coordinates: new GeoPoint(clientValues.latitude, clientValues.longitude),
      });
      timers.setSRDoc.end = new Date().getTime();
      console.log(`Save Swiss Re response to ${swissReRef.id}`);
    }
    console.log('rating updates: ', ratingUpdates);

    // how should agent info be set / overwritten ?? what if agent shares quote with unauthenticated user ?
    // only set agent info if no agent is present ?? if (!formData.agentInfo && req.agentInfo) -> set agentInfo

    try {
      // MERGE VALUES WITH PROTOSURE DATA (INPUTS)
      const inputUpdates: any = {
        inputData: {
          building_coverage_limit: clientValues.limitA,
          cov_b_limit: clientValues.limitB,
          cov_c_limit: clientValues.limitC,
          cov_d_limit: clientValues.limitD,
          first_named_insured: `${clientValues.firstName} ${clientValues.lastName}`.trim() || null,
          historical_flood_losses: clientValues.priorLossCount,
          county_fips,
          ...ratingUpdates,
          ...propertyDataUpdates,
        },
      };

      if (shouldCallSK) {
        inputUpdates.inputData.risk_location_address = {
          street1: clientValues.addressLine1,
          street2: clientValues.addressLine2,
          city: clientValues.city,
          state: clientValues.state,
          countyName: clientValues.countyName || '',
          countyFips: county_fips,
          zip: clientValues.postal,
          latitude: clientValues.latitude,
          longitude: clientValues.longitude,
        };
      }

      // UPDATE QUOTE IN PROTOSURE
      timers.updateQuote.start = new Date().getTime();
      const { data: updateRes } = await protosure.patch(
        `/quotes/${quoteId}/update_input_data/`,
        inputUpdates
      );
      timers.updateQuote.end = new Date().getTime();
      console.log('UPDATE RES: ', updateRes);
      // OTHER CLIENT SIDE INPUTS
      //  - first_named_insured
      //  - first_named_insured_address
      //  - policy_effective_date
      //  - county_fips
      //  - risk_location_address
      //    -  street1
      //    -  street2
      //    -  city
      //    -  state
      //    -  countyName
      //    -  countyFips
      //    -  zip
      //    -  latitude
      //    -  longitude
      //  - historical_flood_losses

      // INPUTS FROM AUTH / DB
      //  - agent_phone
      //  - license
      //  - surplus_lines_producer_phone

      // INPUTS FROM PROPERTY DATA API
      //  - assessment_hh_us_basement
      //  - flood_zone_letter_only
      //  - distance_to_water
      //  - cov_a_rcv_building_replacement_cost
      //  - cov_b_rcv_unattached_dwellings_limit
      //  - cov_c_rcv_content_limit
      //  - cov_d_rcv_living_expenses_limit

      // CALL RATING CALC IF REQUIRED
      //  - when should calc be called ?? if !premium || shouldCallSR || shouldCallSK

      let premCalc;
      try {
        timers.calcQuote.start = new Date().getTime();
        const { data: calcRes } = await protosure.post(`/quotes/${quoteId}/calculate_rater/`, {});
        console.log('CALC RES: ', JSON.stringify(calcRes, null, 2));
        timers.calcQuote.end = new Date().getTime();
        premCalc = calcRes;
      } catch (err) {
        // @ts-ignore
        console.log(err.response.data);
        throw err;
      }
      const performance: any = {};
      for (const key in timers) {
        performance[key] = timers[key].end - timers[key].start;
      }

      res.status(200).send({ updateRes, premCalc, performance });
    } catch (error) {
      // @ts-ignore
      console.log(error.response);
      throw new Error('Error updating quote');
    }
  }
);

export { router as updateQuoteRouter };

function checkPropertyDataCallRequired(clientValues: any, dbValues: any) {
  const { latitude: clientLat, longitude: clientLng } = clientValues;
  const { latitude: dbLat, longitude: dbLng } = dbValues.formData.risk_location_address;

  return !(clientLat === dbLat && clientLng === dbLng);
}

// coords limits, numStories, deductible, RCV (possible to change RCV ?? check anyway ??)
function checkSRCallRequired(clientValues: any, dbValues: any) {
  const limitASame = clientValues.limitA === dbValues.formData.building_coverage_limit;
  const limitBSame = clientValues.limitB === dbValues.formData.cov_b_limit;
  const limitCSame = clientValues.limitC === dbValues.formData.cov_c_limit;
  const limitDSame = clientValues.limitD === dbValues.formData.cov_d_limit;

  // TODO: Protosure missing number of stories
  const deductibleSame =
    clientValues.deductible ===
    dbValues.formData.type_wtextinput_a0b9f72cac5f42108dafa0b4450baed7_20230202171321;

  return !(limitASame && limitBSame && limitCSame && limitDSame && deductibleSame);
}

function getXMLBodyVars(clientValues: any, rcvRef?: number | null) {
  const { latitude, longitude, limitA, limitB, limitC, limitD, deductible } = clientValues;
  rcvRef = rcvRef ?? 250000;
  const rcvA = rcvRef;
  const rcvB = limitB > 0 ? rcvRef * 0.05 : 0;
  const rcvC = limitC > 0 ? rcvRef * 0.25 : 0;
  const rcvD = limitD > 0 ? rcvRef * 0.1 : 0;
  const rcvTotal = rcvA + rcvB + rcvC + rcvD;

  return {
    lat: latitude,
    lng: longitude,
    rcvTotal: rcvTotal,
    rcvAB: rcvA + rcvB,
    rcvC: rcvC,
    rcvD: rcvD,
    limitAB: limitA + limitB,
    limitC: limitC,
    limitD: limitD,
    deductible: deductible,
    numStories: 1,
  };
  // return {
  //   lat: clientValues.latitude,
  //   lng: clientValues.longitude,
  //   rcvTotal: quoteData.asdf,
  //   rcvAB: quoteData.rcv_a + quoteData.rcv_b,
  //   rcvC: quoteData.rcv_c,
  //   rcvD: quoteData.rcv_d,
  //   limitAB: clientValues.limitA + clientValues.limitB,
  //   limitC: clientValues.limitC,
  //   limitD: clientValues.limitD,
  //   deductible: clientValues.deductible,
  //   numStories: quoteData.numStories,
  // };
}

// {
//   LAT: 38.306612, // from values ??
//   LNG: -78.9156, // from values
//   RCV_TOTAL: 600000, // from quoteData
//   RCV_AB: 500000, // from quoteData
//   RCV_C: 80000, // from quoteData
//   RCV_D: 20000, // from quoteData
//   LIMIT_AB: 500000, // from values
//   LIMIT_C: 80000, // from values
//   LIMIT_D: 20000, // from values
//   DEDUCTIBLE: 2000, // from values
//   NUM_STORIES: 1, // from quoteData
// }

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
  let numStories = parseInt(spatialKeyData.us_hh_assessment_num_stories.replace(/\D/g, '')) || null;
  let replacementCost = parseInt(spatialKeyData.us_hh_replacement_cost) || null;
  let propertyCode = spatialKeyData.us_hh_property_use_code;
  let yearBuilt = parseInt(spatialKeyData.us_hh_year_built) || null;
  let floodZone = spatialKeyData.us_hh_fema_all_params_zone;
  let CBRSDesignation = spatialKeyData.us_hh_fema_cbrs_params_designation;
  let basement = spatialKeyData.us_hh_assessment_basement;
  const dtcArr = spatialKeyData.us_hh_dtc_beach_distance.split(' ');
  let distToCoastUnit = dtcArr[dtcArr.length - 1];
  let distToCoastFeet = parseInt(spatialKeyData.us_hh_dtc_beach_distance.replace(/\D/g, '')); // || null

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
  if (distToCoastUnit.toLowerCase() === 'mile' || distToCoastUnit.toLowerCase() === 'miles') {
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

//  - assessment_hh_us_basement
//  - flood_zone_letter_only
//  - distance_to_water
//  - cov_a_rcv_building_replacement_cost
//  - cov_b_rcv_unattached_dwellings_limit
//  - cov_c_rcv_content_limit
//  - cov_d_rcv_living_expenses_limit

function mapExtractedToProtosure(extractedValues: PropData) {
  const rcRef = extractedValues.replacementCost;

  const propValues = {
    assessment_hh_us_basement: extractedValues.basement,
    flood_zone_letter_only: extractedValues.floodZone.charAt(0),
    distance_to_water: extractedValues.distToCoastFeet,
    distance_to_coast: extractedValues.distToCoastFeet,
    cov_a_rcv_building_replacement_cost: rcRef,
    cov_b_rcv_unattached_dwellings_limit: rcRef ? rcRef * 0.05 : null,
    cov_c_rcv_content_limit: rcRef ? rcRef * 0.25 : null,
    cov_d_rcv_living_expenses_limit: rcRef ? rcRef * 0.1 : null,
  };
  console.log(propValues);
  return propValues;
}
