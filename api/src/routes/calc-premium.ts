import express, { Request, Response } from 'express';
import invariant from 'tiny-invariant';

import { ProtosureFormData, ProtosureQuoteData } from '../common/index.js';
import { validateRequest } from '../middlewares/index.js';
import { calcPremiumValidation } from '../middlewares/validation/index.js';
import { protosure } from '../services/index.js';

// DELETE - abandoned protosure integration

const router = express.Router();

router.get(
  '/calc-premium/:quoteId',
  calcPremiumValidation,
  validateRequest,
  // TODO: middleware to get user details
  async (req: Request, res: Response) => {
    const { quoteId } = req.params;
    console.log('QUOTE ID: ', quoteId);

    // GET QUOTE FROM PROTOSURE
    const { data: quoteData } = await protosure.get<ProtosureQuoteData>(
      `/quotes/${quoteId}/`,
    );
    console.log('GET QUOTE RES: ', quoteData);

    try {
      // VALID REQUIRED FIELDS
      await validateFields(quoteData.formData);
    } catch (err) {
      console.log('FAILED VALIDATION: ', err);
    }

    try {
      const { data: calcRes } = await protosure.post(
        `/quotes/${quoteId}/calculate_rater/`,
        {},
      );
      // console.log('CALC RES: ', JSON.stringify(calcRes, null, 2));

      res.status(200).send({ calcRes });
    } catch (err) {
      // @ts-ignore
      console.log(err.response);
      throw err;
    }
  },
);

export { router as calcPremiumRouter };

// TODO: protosure zod typing
async function validateFields(formFields: ProtosureFormData) {
  const {
    aal_inland_flood,
    aal_storm_surge,
    aal_tsunami,
    assessment_hh_us_basement,
    building_coverage_limit,
    risk_location_address: { street1, city, countyName, state, zip },
    cov_a_rcv_building_replacement_cost,
    cov_b_limit,
    cov_b_rcv_unattached_dwellings_limit,
    cov_c_limit,
    cov_c_rcv_content_limit,
    cov_d_limit,
    cov_d_rcv_living_expenses_limit,
    distance_to_coast,
    flood_zone_letter_only,
    occupancy,
  } = formFields;

  invariant(
    typeof aal_inland_flood === 'number',
    'Required: "aal_inland_flood" must be a number',
  );
  invariant(
    typeof aal_storm_surge === 'number',
    'Required: "aal_storm_surge" must be a number',
  );
  invariant(
    typeof aal_tsunami === 'number' || typeof aal_tsunami === 'object',
    'aal_tsunami must be a number type or null',
  );
  invariant(assessment_hh_us_basement, 'Required: "basement"');
  invariant(building_coverage_limit, 'Required: "building_coverage_limit"');
  invariant(street1, 'Required: "risk_location_address.street1"');
  // invariant(typeof street2 === 'string', 'Required: "risk_location_address.street2"');
  invariant(city, 'Required: "risk_location_address.city"');
  invariant(countyName, 'Required: "risk_location_address.countyName"');
  invariant(state, 'Required: "risk_location_address.state"');
  invariant(zip, 'Required: "risk_location_address.zip"');
  invariant(
    cov_a_rcv_building_replacement_cost,
    'Required: "cov_a_rcv_building_replacement_cost" must be a number',
  );
  invariant(cov_b_limit, 'Required: "cov_b_limit" must be a number');
  invariant(
    cov_b_rcv_unattached_dwellings_limit,
    'Required: "cov_b_rcv_unattached_dwellings_limit" must be a number',
  );
  invariant(cov_c_limit, 'Required: "cov_c_limit" must be a number');
  invariant(
    cov_c_rcv_content_limit,
    'Required: "cov_c_rcv_content_limit" must be a number',
  );
  invariant(cov_d_limit, 'Required: "cov_d_limit" must be a number');
  invariant(
    cov_d_rcv_living_expenses_limit,
    'Required: "cov_d_rcv_living_expenses_limit" must be a number',
  );
  // invariant(, 'Required: ""') // TODO: deductible (need to rename randomized variable name)
  invariant(distance_to_coast, 'Required: "distance_to_coast"');
  invariant(flood_zone_letter_only, 'Required: "flood_zone_letter_only"');
  invariant(occupancy, 'Required: "occupancy"');
  // invariant(, 'Required: ""') // TODO: subproducer commission (need to rename randomized variable name)
}
