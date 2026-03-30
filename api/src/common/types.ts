// import { Timestamp } from 'firebase-admin/firestore';

// delete - replaced with array of SubjectBaseItems
// export type SubjectBase =
//   | 'premium'
//   | 'premium_and_fees'
//   | 'outstate_premium_and_fees'
//   | 'premium_and_inspection'
//   | 'flat_dollar'
//   | 'no_fee';

// export type WithId<T> = T & { id: string };

// export type Product = 'flood' | 'wind';

// export type SubjectBaseItems =
//   | 'premium'
//   | 'inspectionFees'
//   | 'mgaFees'
//   | 'outStatePremium'
//   | 'homeStatePremium'
//   | 'fixedFee';

// export type AddressComponentType =
//   | 'street_number'
//   | 'route'
//   | 'locality'
//   | 'administrative_area_level_1'
//   | 'administrative_area_level_2'
//   | 'postal_code'
//   | 'country';

// export interface AddressComponent {
//   long_name: string;
//   short_name: string;
//   types: AddressComponentType[];
// }

// export interface BaseMetadata {
//   created: Timestamp;
//   updated: Timestamp;
// }

// export type LineOfBusiness = 'commercial' | 'residential';

// export type TaxItemName =
//   | 'Premium Tax'
//   | 'Service Fee'
//   | 'Stamping Fee'
//   | 'Regulatory Fee'
//   | 'Windpool Fee'
//   | 'Surcharge'
//   | 'EMPA Surcharge'
//   | 'Bureau of Insurance Assessment';

// export interface Tax {
//   state: string;
//   displayName: TaxItemName;
//   effectiveDate: Timestamp;
//   expirationDate?: Timestamp | null;
//   LOB: LineOfBusiness[];
//   products: Product[];
//   transactionTypes: TransactionType[];
//   subjectBase: SubjectBaseItems[];
//   baseRoundType?: RoundingType;
//   baseDigits?: number;
//   resultRoundType: RoundingType;
//   resultDigits?: number;
//   rate: number;
//   rateType: 'fixed' | 'percent';
//   refundable?: boolean;
//   metadata: BaseMetadata;
// }

// code?: string;
// SLAMembershipRequired?: boolean;
// affidavitReport?: string; // TODO: better typing
// periodicReport?: string;
// annualReport?: string;
// zeroReport?: boolean | string;
// vendorName?: string;
// filing?: string;
// website?: string;
// username?: string;
// password?: string; // TODO: do not store here !! ??
// address?: Address;

// export interface FIPSDetails {
//   state: string;
//   stateFP: string;
//   countyName: string;
//   countyFP: string;
//   classFP?: string;
// }

// export interface Moratorium {
//   locationDetails: FIPSDetails[];
//   locations: string[];
//   product: { [Property in keyof Product]: boolean };
//   effectiveDate: Timestamp; // string;
//   expirationDate: Timestamp; // string;
//   reason?: string;
//   metadata: BaseMetadata;
// }

// export interface MoratoriumWithId extends Moratorium {
//   id: string;
// }

// export type LicenseOwner = 'individual' | 'organization';
// export type LicenseType = 'producer' | 'surplus lines' | 'MGA' | 'Tax ID';

// export interface License {
//   state: string;
//   ownerType: LicenseOwner;
//   licenseType: LicenseType;
//   surplusLinesProducerOfRecord: boolean;
//   licenseNumber: string;
//   effectiveDate: Timestamp;
//   expirationDate?: Timestamp | null;
//   SLAssociationMembershipRequired?: boolean;
// }

// export interface LicenseWithId extends License {
//   id: string;
// }

// export interface SRPerilAAL {
//   tiv: number;
//   fguLoss: number;
//   preCatLoss: number;
//   perilCode: string;
// }

// export interface SRRes {
//   correlationId: string;
//   bound: boolean;
//   messages?: {
//     text: string;
//     type: string;
//     severity: string;
//   }[];
//   expectedLosses: SRPerilAAL[];
// }

// export interface SRResWithAAL extends SRRes {
//   inlandAAL?: number | null;
//   surgeAAL?: number | null;
//   submissionId: string;
//   address?: {
//     addressLine1: string;
//     addressLine2?: string;
//     city: string;
//     state: string;
//     postal: string;
//   };
//   coordinates?: GeoPoint;
// }

export interface ProtosureQuoteData {
  calculatedData: ProtosureCalcData;
  chartsData: { [key: string]: any };
  formData: ProtosureFormData;
  id: string;
  inputData: Partial<ProtosureFormData>;
  metaData: any;
  policy: string;
  policyNumber: string;
  quoteNumber: string;
  raterData: ProtosureRaterData;
}

export type ProtosureSubmissionStatus =
  | 'UNSUBMITTED'
  | 'SUBMITTED'
  | 'UW_REVIEWING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'REJECTED_FINAL';

export interface ProtosureMetadata {
  createdAt: string;
  formTemplateId: string;
  formTemplateVersion: number;
  id: string;
  modifiedAt: string;
  policyId: string;
  policyNumber: string;
  quoteNumber: string;
  status: ProtosureSubmissionStatus;
}

export interface ProtosureAddress {
  street1: string | null;
  street2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  latitude: number | null;
  longitude: number | null;
  countyName: string | null;
  countyFips: string | null;
}

export interface ProtosureFormData {
  aal_inland_flood: number | null;
  aal_storm_surge: number | null;
  aal_tsunami: number | null;
  adjust_if: null;
  adjust_ss: null;
  adjust_ts: null;
  agency_address: ProtosureAddress;
  agency_name: string | null;
  agent_name: string;
  agent_phone: string;
  assessment_hh_us_basement: string | null;
  building_coverage_limit: number | null;
  county_fips: string | null;
  cov_a_rcv_building_replacement_cost: number | null;
  cov_b_limit: number | null;
  cov_b_rcv_unattached_dwellings_limit: number | null;
  cov_c_limit: number | null;
  cov_c_rcv_content_limit: number | null;
  cov_d_limit: number | null;
  cov_d_rcv_living_expenses_limit: number | null;
  distance_to_coast: number | null;
  distance_to_water: number | null;
  first_floor_diff_to_grade_ft: number | null;
  first_named_insured: string | null;
  first_named_insured_address: ProtosureAddress;
  flood_zone_letter_only: string | null;
  hazardhub: null | { [key: string]: any };
  historical_flood_losses: number | string | null;
  inspection_fee: number | null;
  license: string | null;
  mga_fee: number | null;
  occupancy: string | null;
  policy_effective_date: Date | string | null;
  policy_expiration_date: Date | string | null;
  policy_number: string | null;
  property_number: string | null;
  risk_location_address: ProtosureAddress;
  risk_score_inland_flood: number | null;
  risk_score_storm_surge: number | null;
  risk_score_tsunami: number | null;
  state_of_issue: string | null;
  surplus_lines_home_state: string | null;
  surplus_lines_producer_phone: string | null;
  surplus_producer: string | null;
  surplus_producer_address: ProtosureAddress;
  uw_adjust: string | number | null;
  type_wpercentselectinput_1e4ab3589010432889dd344147dced88_20230203153845:
    | number
    | null;
  type_wsliderinput_60cd8d7804f54613979ee9c251b0bfe9_20230205165831:
    | number
    | null;
  type_wtextinput_022fd521dbfa4ae99a321b250ef0727e_20230202142214:
    | number
    | null;
  type_wtextinput_a0b9f72cac5f42108dafa0b4450baed7_20230202171321:
    | number
    | null;
}

export interface ProtosureRaterData {
  input_AAL_IF1: number;
  input_AAL_TC1: number;
  input_AAL_Ts1: string | number;
  input_Adjust_IF1: string | number;
  input_Adjust_SS1: string | number;
  input_Adjust_Ts1: string | number;
  input_Assessment_Basement1: string;
  input_Building_Cov_Limit1: number;
  input_City1: string;
  input_Claims_Value1: string;
  input_County1: string;
  input_Cov_A_RCV: number;
  input_Cov_B_Limit1: number;
  input_Cov_B_RCV1: number;
  input_Cov_C_Limit1: number;
  input_Cov_C_RCV1: number;
  input_Cov_D_Limit1: number;
  input_Cov_D_RCV1: number;
  input_Deductible1: number;
  input_Distance_to_Coast1: number;
  input_FFE1: string | number;
  input_FIPS1: number;
  input_Flood_Zone1: string;
  input_Hist_Flood_Losses1: number;
  input_Inspection_Fee1: string | number;
  input_MGA_Fee1: number;
  input_Occupancy1: string;
  input_Property_Number1: string;
  input_RCV_XS_Limit1: number;
  input_State1: string;
  input_Street_Address11: string;
  input_Street_Address21: string;
  input_SubProd_Com1: number;
  input_UW_Adjust1: string | number;
  input_Zip_Code1: number;
  output_prem_tbl: [string | number[]];
  output_state1: string;
  output_state4: string;
}

export interface ProtosureCalcData {
  RCV_XS_max_limit1: number | null;
  cov_B_C_D_Total1: number | null;
  deductible_tIv_base1: number | null;
  fips1: number | null;
  total_values1: number | null;
}

export interface SpatialKeyResponse {
  us_hh_mls_rm_room11_features: string; // '',
  us_hh_fema_firm_date_cur_eff_date_map: string; // '5/16/2012',
  us_hh_fema_claims_2005: string; // '7',
  us_hh_mls_ex_pool_yes_no: string; // 'YES',
  us_hh_mls_if_security_features: string; // 'Security System, Alarm -Smoke/Fire',
  us_hh_wind_enhanced_params_near_inc_speed: string; // '56',
  us_hh_primary_exterior: string; // 'stucco over masonry',
  us_hh_assessment_improvement_value: number; // 189636,
  us_hh_assessment_num_bedrooms: number; // 4,
  us_hh_fema_all_params_source_citation: string; // '12021C_STUDY6',
  us_hh_assess_tax_market_value: string; // '2863349',
  us_hh_mortgage_loan_type: string; // '',
  us_hh_mls_ex_parking_features: string; // 'Circular Driveway, Paved Driveway',
  us_hh_flood_params_lines_distance: string; // '',
  us_hh_mls_rm_room13_features: string; // '',
  us_hh_mls_rm_family_yes_no: string; // '',
  us_hh_profit: string; // '',
  us_hh_mls_ex_fence_features: string; // 'Fenced (any type)',
  us_hh_fema_all_params_subzone: string; // '',
  us_hh_mls_if_number_fireplaces: null;
  us_hh_fema_claims_2000: string; // '1',
  us_hh_replacement_cost_included: number; // 1,
  us_hh_assessment_roof_cover: string; // '',
  us_hh_fema_firm_date_haz_map_id_date: string; // '5/5/1970',
  us_hh_idemand_included: number; // 1,
  us_hh_assessment_pool: string; // 'Pool (yes)',
  us_hh_wind_enhanced_params_pct_risk: string; // '2.635%',
  us_hh_fema_claims_2011: string; // '0',
  us_hh_wind_region_add_desc: string; // '',
  us_hh_assessment_fireplace: string; // '',
  us_hh_assessment_year: string; // '2021',
  us_hh_assessment_basement: string; // '',
  us_hh_roof_configuration: string; // '',
  us_hh_mls_in_subtype: string; // '',
  us_hh_mls_ex_style_features: string; // 'Ranch, Contemporary, Florida Style, Traditional, Single',
  us_hh_assessment_land_value: number; // 2673713,
  us_hh_flood_params_distance_nearest_flood: string; // '2378',
  us_hh_assessment_num_stories: string; // '1',
  us_hh_assessment_curr_owner_name: string; // 'MICHAEL PRANKE & DEBORAH; PRANKE REVOCABLE TRUST',
  us_hh_mls_in_property_type: string; // 'Residential',
  us_hh_property_owner: string; // 'PRANKE, MICHAEL O & DEBORAH A',
  us_hh_assessment_lot_size_depth_ft: string; // '0',
  us_hh_assessment_num_buildings: number; // 0,
  us_hh_fema_firm_date_entered_program: string; // '7/2/1971',
  us_hh_fema_claims_2016: string; // '0',
  us_hh_assessment_tax_amount: number; // 29381.97,
  us_hh_assessment_tax_delinquent_yr: string; // '',
  us_hh_final_rcv_inclusive_debris_removal: string; // '',
  us_hh_replacement_cost_without_debris_removal: string; // '',
  us_hh_assess_school_tax_dist_3: string; // '',
  us_hh_wind_enhanced_params_description: string; // 'Moderate',
  us_hh_mls_if_security_system_yes_no: string; // 'YES',
  us_hh_fema_firm_date_initial_firm_id_date: string; // '7/2/1971',
  us_hh_assessment_amenities: string; // 'Boat Dock / Ramp / Slip',
  us_hh_assessment_owner_occupied: string; // '',
  us_hh_mls_rm_baths_half: number; // 1,
  us_hh_flood_params_polygon_name: string; // '',
  us_hh_mortgage_title_company: string; // '',
  us_hh_fema_firm_date_non_sfha_pct_disc: string; // '10',
  us_hh_mls_ex_location_features: string; // 'Cul-De-Sac, Dead End Street',
  us_hh_assessment_roof_type: string; // '',
  us_hh_square_footage: string; // '3775',
  us_hh_mls_ad_geo_altitude: string; // '',
  us_hh_assessment_building_condition: string; // '',
  us_hh_mls_lr_list_price: number; // 3850000,
  us_hh_property_address: string; // '2595 TARPON RD, NAPLES, FL 34102',
  us_hh_assess_school_tax_dist_2_ind: string; // '',
  us_hh_assessment_lsale_doc_number: string; // '5709064',
  us_hh_mls_lr_list_date: string; // '11/19/2018',
  us_hh_assessment_site_influence: string; // '',
  us_hh_property_street_address: string; // '2595 TARPON RD',
  us_hh_fema_claims_2009: string; // '0',
  us_hh_assessment_tax_rate_code_area: string; // '0004',
  us_hh_mls_ex_water_front_features: string; // 'Bay',
  us_hh_mls_rm_room11_type: string; // '',
  us_hh_property_price_range_max: number; // 7061822,
  us_hh_assessment_owner1_last_name: string; // 'PRANKE',
  sk_latitude: number; // 26.116867,
  us_hh_assessment_garage_cars: number; // 1,
  us_hh_flood_params_elevation_of_point: string; // '8',
  us_hh_wind_enhanced_params_near_inc_dist: string; // '0.5',
  us_hh_mls_ex_construction_features: string; // 'Concrete Block, Piling, Stucco',
  us_hh_assessment_garage_type: string; // 'Carport',
  us_hh_mls_in_public_remarks: string; // 'Breathtaking views south across Naples Bay...without a doubt, this "King-sized" lot is one of the prime locations in all of Royal Harbor! Few locations in Naples compare! New construction homes surround you in this Estate section of #RoyalHarbor ~Do you like to entertain? Do you have a big family? This traditional ranch has spacious rooms and beautiful light. 4 bedrooms plus a HUGE study, a formal living room with a fireplace, and the dining room is big enough to accommodate a very large table for family gatherings...The pool, the dock, the view, the kitchen!! And did I mention the VIEW? Chalk this up to the best bay front buy in town! Modernize the existing home to make it your own, or build your dream home...Priced at Lot Value! *Please see confidential remarks.',
  us_hh_fema_firm_date_type: string; // 'CITY OF',
  us_hh_flood_params_lines_diff: string; // '',
  us_hh_overhead: string; // '',
  us_hh_fema_claims_2010: string; // '0',
  us_hh_flood_params_lines_description: string; // '',
  us_hh_mls_ad_zone_features: string; // '',
  us_hh_assessment_year_built: string; // '1985',
  us_hh_fema_claims_2004: string; // '1',
  us_hh_fema_base_elevation: string; // '',
  us_hh_fema_firm_date_cid: string; // '125130',
  us_hh_architectural_style: string; // 'COLONIAL, SOUTHERN',
  us_hh_assessment_lot_size_acres: number; // 0.4,
  us_hh_mls_ex_view_features: string; // 'Bay View, Water View',
  us_hh_fema_base_elevation_distance: string; // '',
  us_hh_assess_school_tax_dist_3_ind: string; // '',
  us_hh_assessment_amenities_2: string; // '',
  us_hh_fema_claims_2015: string; // '1',
  us_hh_assessment_num_units: number; // 0,
  us_hh_fema_all_params_flood_ar: string; // '12021C_37873',
  us_hh_mortgage_est_balance: string; // '',
  us_hh_wind_pool_desc: string; // 'In State Designated Wind Pool Zone',
  us_hh_assessment_building_quality: string; // 'C',
  us_hh_mls_ex_lot_size_acres: number; // 0.4,
  us_hh_mls_rm_rooms_total: number; // 0,
  us_hh_wind_enhanced_params_25_miles_last_decade: string; // '79',
  us_hh_fema_firm_date_status: string; // 'C',
  us_hh_assess_school_tax_dist_2: string; // '',
  us_hh_wind_enhanced_params_score: string; // 'C',
  us_hh_fema_claims_2003: string; // '1',
  us_hh_assessment_legal_subdivision: string; // 'ROYAL HARBOR UNIT 3',
  us_hh_debris_removal: string; // '',
  us_hh_mls_if_fireplace_features: string; // 'Fireplace',
  us_hh_wind_enhanced_params_scale: string; // '32',
  us_hh_assessment_legal_brief_description: string; // 'SEC/TWN/RNG/MER:SEC 15 TWN 50 RNG 25 ROYAL HARBOR UNIT 3 BLK 12 LOT 50 MAP REF:MAP 5A15',
  us_hh_assessment_psale_price: string; // '2700000',
  sk_id: number; // 1,
  us_hh_mls_if_levels_features: string; // '01 Story',
  us_hh_mls_rm_general_features: string; // 'Family Room, Den',
  us_hh_construction_type: string; // 'stucco on masonry',
  us_hh_mls_rm_baths_full: number; // 3,
  us_hh_assessment_lsale_price: string; // '3600000',
  us_hh_mls_ex_pool_features: string; // 'Above ground, Concrete, Heated, Screen Enclosed',
  us_hh_physical_shape: string; // 'rectangular',
  hazarduw_rank: string | number | null; // null,
  us_hh_mls_sc_school_district: string; // '',
  us_hh_flood_params_polygon_type: string; // 'Large River',
  us_hh_assessment_air_conditioning_type: string; // '',
  us_hh_fema_firm_date_comm_entry_date: string; // '10/1/1992',
  us_hh_mls_ex_road_features: string; // 'CI,DE,PV,PB',
  us_hh_flood_params_polygons_distance: string; // '2378',
  us_hh_assessment_building_area_1: number; // 0,
  us_hh_mls_ex_garage_features: string; // 'Automatic Garage Door, Attached',
  us_hh_fema_cbrs_params_designation: string; // 'OUT',
  us_hh_mls_if_cooling_features: string; // 'Ceiling Fans, Central - Electric',
  us_hh_mls_ex_water_access_features: string; // 'GA',
  us_hh_flood_params_polygons_diff: string; // '7',
  us_hh_flood_params_polygons_score: string; // 'F',
  us_hh_fema_firm_date_name: string; // 'NAPLES',
  us_hh_assessment_num_baths: number; // 4,
  us_hh_fema_claims_2014: string; // '0',
  us_hh_wind_enhanced_params_near_inc_type: string; // 'Thunderstorm Wind',
  us_hh_mls_if_cooling_yes_no: string; // 'YES',
  us_hh_mls_rm_dining_features: string; // 'Breakfast Bar, Formal',
  us_hh_property_use_code: string; // 'Single Family Residence',
  us_hh_assessment_total_assessed_value: number; // 2863349,
  us_hh_construction_quality: string; // 'above average / upgraded',
  us_hh_mortgage_loan_amount: string; // '',
  us_hh_fema_all_score: string; // 'F',
  us_hh_fema_claims_2008: string; // '1',
  us_hh_mls_if_water_features: string; // 'Central Water',
  us_hh_mls_rm_baths_total: number; // 4,
  us_hh_wind_enhanced_params_near_inc_prop_dam: string; // '0.50K',
  us_hh_assess_school_tax_dist_1: string; // '',
  us_hh_fema_claims_total: string; // '44',
  us_hh_number_of_stories: string; // '',
  us_hh_mortgage_lender_name_ben: string; // '',
  us_hh_fema_firm_date_comm_name: string; // 'Naples, City of',
  us_hh_mls_rm_room13_type: string; // '',
  us_hh_flood_params_elevation_nearest_flood: string; // '1',
  us_hh_archtect_fees_permits: string; // '',
  us_hh_mls_ex_general_features: string; // 'Boating, Gas Grill',
  us_hh_assessment_main_buil_area_indicator: string; // '',
  us_hh_mls_ex_lot_size_features: string; // 'Regular',
  us_hh_mls_in_year_built: number; // 1985,
  us_hh_mls_if_window_features: string; // 'Awning, Bay Window(s), Picture Window, Single Hung, Skylights, Sliding',
  us_hh_fema_claims_2007: string; // '0',
  us_hh_wind_region_score: string; // 'F',
  us_hh_assessment_total_market_value: 2863349;
  us_hh_mls_if_utilities_features: string; // '',
  us_hh_assessment_neighborhood_code: string; // '24 RHU3',
  us_hh_assessment_owner1_first_name: string; // 'MICHAEL O',
  us_hh_assessment_owner2_last_name: string; // 'PRANKE',
  us_hh_fema_all_params_dfirm: string; // '12021C',
  us_hh_wind_enhanced_params_add_risk: string; // '0.03',
  us_hh_assessment_heating: string; // '',
  sk_country_code: string; // 'US',
  us_hh_assessment_total_num_rooms: string; // '0',
  us_hh_mls_if_basement_features: string; // '',
  us_hh_dtc_coastal_distance: string; // '77 feet',
  us_hh_replacement_cost: string; // '1643000',
  us_hh_mls_in_living_sq_feet: string; // '3775',
  sk_longitude: number; // -81.787231,
  us_hh_flood_description: string; // 'Very High risk of flood damage',
  us_hh_assessment_owner2_first_name: string; // 'DEBORAH A',
  us_hh_mls_ex_patio_yes_no: string; // '',
  us_hh_assessment_lvalid_price: string; // '3600000',
  us_hh_property_price_range_min: number; // 4907367,
  us_hh_mls_lr_status: string; // 'Sold',
  us_hh_mls_if_appliance_features: string; // 'Cook Top Range, Dishwasher, Disposal, Dryer, Microwave, Range, Self-Cleaning Oven, Washer, Grill Built-in',
  us_hh_fema_firm_date_sfha_pct_disc: string; // '25',
  us_hh_mls_rm_kitchen_features: string; // 'Outdoor Kitchen, Built-In Desk, Island',
  country_code_hazard: string; // 'US',
  us_hh_fema_claims_2002: string; // '0',
  us_hh_mls_ex_patio_features: string; // '',
  us_hh_mls_if_fireplace_yes_no: string; // 'YES',
  us_hh_slope_of_site: string; // '',
  us_hh_mls_rm_bedrooms_total: 4;
  us_hh_mortgage_est_ltv_combined: string; // '0.0000',
  us_hh_wind_enhanced_params_near_inc_injuries: string; // '0',
  us_hh_flood_params_lines_name: string; // '',
  us_hh_wind_enhanced_params_hist_events_radius: string; // '95% chance of damaging wind occurrence in 10 years in a 2.81 mile radius',
  us_hh_mls_if_floor_features: string; // 'Carpet, Tile, Wood',
  us_hh_fema_claims_2013: string; // '0',
  us_hh_flood_params_diff: string; // '7',
  us_hh_fema_all_params_version: string; // '1.1.1.0',
  us_hh_wind_enhanced_params_near_inc_year: string; // '2007',
  us_hh_foundation_type: string; // '',
  us_hh_property_zip: string; // '34102',
  us_hh_mls_if_basement_yes_no: string; // '',
  us_hh_fema_firm_date_current_effective_date: string; // '10/1/2015',
  us_hh_fema_claims_2001: string; // '3',
  us_hh_fema_base_elevation_description: string; // 'NO REPORT',
  us_hh_fema_claims_2018: string; // '0',
  us_hh_mortgage_open_lien_balance: string; // '',
  us_hh_fema_all_params_special_hazard_area: string; // 'T',
  us_hh_mls_ex_parking_spaces: string | number | null; //  null,
  us_hh_assessment_parcel_number: string; // '18411080009',
  us_hh_mls_if_heating_features: string; // 'Central Electric, Heat Pump, Zoned, Electric',
  sk_location_granularity: number; // -1,
  us_hh_assessment_air_conditioning: string; //  '',
  us_hh_mls_ex_sewer_features: string; //  'Central Sewer',
  us_hh_fema_all_params_zone: string; //  'AE',
  us_hh_wind_pool_name: string; //  'Territory 62',
  us_hh_wind_pool_score: string; //  'D',
  us_hh_mls_in_association_dues1: string; //  '',
  us_hh_wind_enhanced_params_dam_inc_25_miles: string; //  '124',
  us_hh_mls_ex_lot_size_sq_feet: string | number | null; //  null,
  us_hh_assessment_lsale_price_code: string; // 'Sales Price or Transfer Tax rounded by county prior to computation. Varies by county.',
  us_hh_flood_params_lines_score: string; // 'A',
  us_hh_assessment_construction_type: string; // '',
  us_hh_mls_ex_exterior_wall_features: string; // '',
  us_hh_assessment_topography: string; // '',
  us_hh_wind_region_desc: string; // 'HazardHub Hurricane Prone Wind Region: Risk varies with location',
  us_hh_dtc_high_res_distance: string; // '77 feet',
  us_hh_assess_school_tax_dist_1_ind: string; // '',
  us_hh_primary_roof_covering: string; // 'CONCRETE TILE',
  us_hh_assessment_plumbing_fixtures: number; // 0,
  us_hh_assessment_lot_size_frontage_ft: string; // '1000',
  us_hh_assessment_lot_size_square_ft: number; // 17424,
  us_hh_assessment_num_part_baths: number; // 0,
  us_hh_mls_ex_garage_spaces: number; // 2,
  us_hh_mls_ex_roof_features: string; // 'Tile',
  us_hh_mls_in_sold_price: string; // '',
  us_hh_fema_all_description: string; // 'Covered by FEMA digital maps. In 100 Year Floodplain',
  us_hh_fema_all_params_study_type: string; // 'NP',
  us_hh_flood_params_polygon_description: string; // 'River',
  us_hh_flood_score: string; // 'F',
  us_hh_assessment_building_area: number; // 3775,
  us_hh_assessment_land_use_code: string; // 'Residential (General) (Single)',
  us_hh_wind_enhanced_params_near_inc_crop_dam: string; // '0.00K',
  us_hh_assessment_lsale_recording_date: string; // '20190507',
  us_hh_fema_claims_2012: string; // '0',
  us_hh_fema_firm_date_current_class: string; // '5',
  us_hh_dtc_low_res_distance: string; // '79 feet',
  us_hh_fema_claims_2006: string; //  '1',
  us_hh_mls_ex_spa_yes_no: string; // '',
  us_hh_wind_enhanced_params_near_inc_deaths: string; // '0',
  us_hh_mls_if_general_features: string;
  // 'Cable Available, Smoke Alarm, Unfurnished, Bar, Built-In Cabinets, Cable Prewire, Closet Cab, Custom Mirror, Exclusions, Foyer, French Doors, Walk-In Closets, Window Coverings',
  hazarduw_flood_rank: string | number | null; // null,
  us_hh_mls_rm_laundry_features: string; // '',
  us_hh_year_built: string; // '1985',
  us_hh_property_apn: string; // '18411080009',
  us_hh_mls_in_sold_date: string; // '',
  us_hh_house_materials_labor: string; // '',
  us_hh_dtc_beach_distance: string; // '1.08 miles',
  us_hh_fema_claims_2017: string; // '26',
  us_hh_locale: string; // 'suburban',
  us_hh_fema_base_elevation_meter: string; // '',
  us_hh_mls_ex_foundation_features: string; // '',
}
