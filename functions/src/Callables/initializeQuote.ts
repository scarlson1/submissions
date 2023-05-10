import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v1/https';
import axios from 'axios';

// TODO: check metadata.status !== 'BOUND'

export default async ({ data }: CallableRequest) => {
  console.log('data: ', data);
  const { quoteId } = data;

  if (!quoteId) {
    try {
      const { data } = await axios.post(
        `${process.env.PROTOSURE_API_URL_DEV}/public-api/${process.env.PROTOSURE_TENANT_ID_V2}/quotes/get_or_create/`,
        {},
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      );

      let res = {
        protosureData: data,
        initialFormData: getInitialFormData(data),
      };

      return res;
    } catch (err) {
      console.log('ERROR: ', err);

      throw new HttpsError('internal', `Error retrieving or initializing quote`);
    }
  } else {
    try {
      const { data } = await axios.get(
        `${process.env.PROTOSURE_API_URL_DEV}/public-api/${process.env.PROTOSURE_TENANT_ID_V2}/quotes/${quoteId}/`,
        {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('GET QUOTE RES: ', data);
      delete data.raterData;
      let res = {
        protosureData: data,
        initialFormData: getInitialFormData(data),
      };

      return res;
    } catch (err) {
      console.log('ERROR: ', err);

      throw new HttpsError('internal', `Error fetching quote data`);
    }
  }
};

function getInitialFormData(p: any) {
  const { formData } = p;
  const { risk_location_address } = formData;
  return {
    addressLine1: risk_location_address.street1 ?? '',
    addressLine2: risk_location_address.street2 ?? '',
    city: risk_location_address.city ?? '',
    state: risk_location_address.state ?? '',
    postal: risk_location_address.zip ?? '',
    latitude: risk_location_address.latitude ?? null,
    longitude: risk_location_address.longitude ?? null,
    // coverageActiveBuilding: true,
    // coverageActiveStructures: true,
    // coverageActiveContents: true,
    // coverageActiveAdditional: true,
    limitA: formData.building_coverage_limit ?? '',
    limitB: formData.cov_b_limit ?? '',
    limitC: formData.cov_c_limit ?? '',
    limitD: formData.cov_d_limit ?? '',
    deductible: 2000,
    priorLossCount:
      typeof formData.Historical_losses === 'string' ? 0 : formData.Historical_losses ?? 0,
    firstName: formData.First_Named_Insured ?? '',
    lastName: '', // TODO: not returned from protosure
    email: '', // TODO:
  };
}

// @ts-ignore
const sampleRes = {
  id: '8f8bcae5-32ab-4ca5-be74-53f7c924f746',
  policy: 'a1ac1e21-84f7-4d0b-9872-b62faa4295a7',
  quoteNumber: 'P-000014-001',
  policyNumber: 'P-000001',
  inputData: {
    Basement: 'No',
    AAL_Tsunami: 6,
    Agency_Name: 'ABC Insurance Co.',
    County_FIPS: '47037',
    Building_RCV: 867000,
    Content_Limit: 200000,
    Policy_Number: '123',
    Occupancy_type: 'Single Family Residential',
    AAL_Storm_Surge: 5,
    AAL_Inland_flood: 10,
    Distance_to_Coast: ">1,320'",
    Historical_losses: 'No',
    Number_of_Stories: '2',
    Risk_Score_Tsunami: 5,
    First_Named_Insured: 'John',
    Living_Expenses_Limit: 50000,
    Policy_Effective_Date: '02/16/2023',
    risk_location_address: {
      zip: '37221-4442',
      city: 'Nashville',
      state: 'TN',
      street1: '2012 McPherson Ln',
      latitude: 36.04062,
      longitude: -86.90712,
      countyFips: '47037',
      countyName: 'Davidson County',
    },
    Flood_Zone_letter_only: 'A',
    Policy_Expiration_Date: '01/02/2024',
    Risk_Score_Storm_Surge: 3,
    Building_Coverage_Limit: 500000,
    Risk_Score_Inland_Flood: 2,
    Surplus_Lines_Home_State: 'Tennessee',
    Building_Ordinance_or_Law: 'No',
    First_floor_diff_to_grade: '1',
    WSelect_Policy_Deductible: '0.01',
    First_Named_Insured_Address: {
      zip: '37203',
      city: 'Nashville',
      state: 'TN',
      street1: '806 Olympic St.',
      street2: null,
      latitude: null,
      longitude: null,
      countyFips: '47037',
      countyName: 'Davidson County',
    },
    Subproducer_Total_Commission: '0.06',
    WSelect_Contents_on_ACV_or_RCV_basis: 'RCV',
    TYPE_WHAZARDHUB_8d44efcb5c5e412cb732ac99e0fdfd30: null,
    TYPE_WWATERDISTANCE_6debe99a053045b991f6e7bb98440cd5: null,
  },
  formData: {
    License: null,
    Basement: 'No',
    Agent_Name: null,
    AAL_Tsunami: 6,
    Agency_Name: 'ABC Insurance Co.',
    Agent_Phone: null,
    County_FIPS: '47037',
    Building_RCV: 867000,
    Content_Limit: 200000,
    Policy_Number: '123',
    Agency_Address: {
      zip: null,
      city: null,
      state: null,
      street1: null,
      street2: null,
      latitude: null,
      longitude: null,
      countyFips: null,
      countyName: null,
    },
    Occupancy_type: 'Single Family Residential',
    State_of_Issue: null,
    AAL_Storm_Surge: 5,
    AAL_Inland_flood: 10,
    Surplus_Producer: null,
    Distance_to_Coast: ">1,320'",
    Historical_losses: 'No',
    Number_of_Stories: '2',
    Risk_Score_Tsunami: 5,
    First_Named_Insured: 'John',
    Living_Expenses_Limit: 50000,
    Policy_Effective_Date: '02/16/2023',
    risk_location_address: {
      zip: '37221-4442',
      city: 'Nashville',
      state: 'TN',
      street1: '2012 McPherson Ln',
      latitude: 36.04062,
      longitude: -86.90712,
      countyFips: '47037',
      countyName: 'Davidson County',
    },
    Flood_Zone_letter_only: 'A',
    Policy_Expiration_Date: '01/02/2024',
    Risk_Score_Storm_Surge: 3,
    Building_Coverage_Limit: 500000,
    Risk_Score_Inland_Flood: 2,
    Surplus_Lines_Home_State: 'Tennessee',
    Surplus_Producer_Address: {
      zip: null,
      city: null,
      state: null,
      street1: null,
      street2: null,
      latitude: null,
      longitude: null,
      countyFips: null,
      countyName: null,
    },
    Building_Ordinance_or_Law: 'No',
    Demand_Surge_Excess_Limit: null,
    First_floor_diff_to_grade: '1',
    WSelect_Policy_Deductible: '0.01',
    Unattached_Dwellings_Limit: null,
    First_Named_Insured_Address: {
      zip: '37203',
      city: 'Nashville',
      state: 'TN',
      street1: '806 Olympic St.',
      street2: null,
      latitude: null,
      longitude: null,
      countyFips: '47037',
      countyName: 'Davidson County',
    },
    Subproducer_Total_Commission: '0.06',
    Surplus_Lines_Producer_Phone: null,
    WSelect_Contents_on_ACV_or_RCV_basis: 'RCV',
    TYPE_WHAZARDHUB_8d44efcb5c5e412cb732ac99e0fdfd30: null,
    TYPE_WWATERDISTANCE_6debe99a053045b991f6e7bb98440cd5: null,
  },
  metaData: {
    id: '8f8bcae5-32ab-4ca5-be74-53f7c924f746',
    formTemplateId: '084e1371-ef46-4b1e-b238-521d486d4e73',
    formTemplateVersion: 1,
    policyId: 'a1ac1e21-84f7-4d0b-9872-b62faa4295a7',
    policyNumber: 'P-000001',
    quoteNumber: 'P-000014-001',
    status: 'BOUND',
    createdAt: '2023-01-25T18:37:37.967564',
    modifiedAt: '2023-01-25T18:41:41.552873',
  },
  raterData: {
    input_FIPS: 47037,
    input_IF_EL: 10,
    input_IF_Ded: 0.01,
    input_street: [['', '', '']],
    output_state: 'TN',
    input_Occ_Type: 'Single Family Residential',
    input_Surge_EL: 5,
    input_HisLosses: '1 less than $15K',
    input_Flood_Zone: 'A',
    input_Tsunami_EL: 6,
    input_Basement_Val: 'No',
    input_Content_Limit: 200000,
    input_DSurgeXSlimit: '',
    input_Building_Value: 867000,
    input_Content_ACV_RCV: 'RCV',
    input_NumberOfStories: 2,
    output_other_info_tbl: [
      ['Other Information', ''],
      ['Historical losses', 0],
      ['Subproducer Total Commission', 0.15],
    ],
    input_First_floor_diff: 1,
    output_anniual_premium: '$904.26',
    output_fin_premium_tbl: [
      ['Final Premium($)', 0],
      ['DWP', 904.255319148936],
    ],
    input_Distance_to_Coast: ">1,320'",
    output_calc_values_tbl1: [
      ['Peril', 'Tech. Prem. ($)'],
      ['Inland Flood', 11.47025],
      ['Storm Surge', 7.1208],
      ['Tsunami', 8.54496],
    ],
    output_calc_values_tbl2: [
      ['Peril', 'Prem. ($)'],
      ['Inland Flood', 27.4626895450918],
      ['Storm Surge', 28.415003990423],
      ['Tsunami', 0],
      ['  Subtotal', 55.8776935355148],
      ['Minimum Prem.', 1000],
      ['Provisional Prem.', 1000],
      ['Subproducer Adj.', -95.7446808510639],
      ['DWP', 904.255319148936],
      ['Validation Errors', 0],
      ['UW Review', 'No'],
    ],
    output_fixed_inputs_tbl: [
      ['Fixed Inputs ', 'Value'],
      ['Inland Flood LAE', 0.1],
      ['Storm Surge LAE', 0.15],
      ['Tsunami LAE', 0.15],
      ['Inland Flood multiplier', 1.5],
      ['Storm Surge multiplier', 2.5],
      ['Tsunami multiplier', 0],
      ['Minimum Premium', 1000],
      ['Ceding Commission + Brokerage', 0.3735],
      ['Subproducer Com. Adj.', -0.09],
    ],
    input_Risk_Score_Tsunami: 5,
    output_coverage_info_tbl: [
      ['Coverage information', 'Default %', 'RCV'],
      ['Building Coverage Limit', 1, 867000],
      ['Unattached Dwellings Limit', 0.05, 43350],
      ['Content Limit', 0.25, 216750],
      ['Living Expenses Limit', 0.1, 86700],
      ['  Subtotal Cov. B/C/D', '', 346800],
      ['Policy Limit', '', 1213800],
      ['Demand Surge Excess Limit', 0, 'Max: $0,000'],
      ['Policy Deductible', 0.01, ''],
      ['Contents on ACV or RCV basis', 'RCV', ''],
      ['Building Ordinance or Law', 'Yes', ''],
    ],
    input_Living_Expenses_Limit: 50000,
    output_def_Content_Limit_pc: 0.25,
    input_Risk_Score_Storm_Surge: 3,
    output_sec_input_factors_tbl: [
      ['Variable inputs', 'Value'],
      ['Basement', 0.86],
      ['Contents ACV/RCV', 1],
      ['Ordinance or Law', 1],
      ['Distance To Coast', 1],
      ['Tier 1', 1],
      ['Demand Surge Excess Limit', 1],
      ['Historical losses Inland', 1.25],
      ['Historical losses Surge', 1.5],
      ['Historical losses Tsunami', 1.5],
      ['FFE diff. to grade (ft) Inland', 0.97],
      ['FFE diff. to grade (ft) Surge', 0.96],
      ['FFE diff. to grade (ft) Tsunami', 0.96],
      ['Multiplier_Inland', 1.04275],
      ['Multiplier_Surge', 1.2384],
      ['Multiplier_Tsunami', 1.2384],
    ],
    input_Building_Coverage_Limit: 500000,
    input_Risk_Score_Inland_Flood: 2,
    input_Building_Ordinance_or_Law: 'No',
    output_commission_reporting_tbl: [
      ['iD:RSI', 0],
      ['Provisional ', 0.2042553191489],
      ['DWP', 0.2258823529412],
      ['RSI:SR QS', 0],
      ['Provisional ', 0.2792553191489],
      ['DWP', 0.3088235294118],
      ['Aon QS Broker Fee p/o RSI:SR QS', 0],
      ['Provisional ', 0.015],
      ['DWP', 0.0165882352941],
    ],
    input_Unattached_Dwellings_Limit: '',
    output_Demand_Surge_Excess_Limit: 'Max: $0,000',
    input_Subproducer_Total_Commission: 0.06,
    output_def_Living_Expenses_Limit_pc: 0.1,
    output_default_Building_Coverage_Limit: 867000,
    output_def_unatttached_dwelling_limit_pc: 0.05,
    output_Rate_and_Commission_Percentages_tbl: [
      ['Provisional Factors', 'iD:RSI', 'RSI:SR'],
      ['Cession Partiicpation %', 1, 0.9],
      ['iDemand MGA Net', 0.15, 0.15],
      ['iDemand Subproducer Default', 0.15, 0.15],
      ['Carrier Fee', 0, 0.06],
      ['Aon QS Broker Fee ', 0, 0.015],
      ['Provisional Rates', 0.3, 0.375],
      ['Rate Making Commission Factors', '', 0],
      ['Provisional Commission', 0, 0.3735],
      ['iDemand Subproducer Adj.', 0, -0.1058823529412],
    ],
  },
  calculatedData: {
    building_coverage_limit: 867000,
  },
  chartsData: {},
};
