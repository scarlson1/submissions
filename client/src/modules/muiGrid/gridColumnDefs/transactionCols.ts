import { GridColDef, GridColumnVisibilityModel } from '@mui/x-data-grid';

import { Transaction } from 'common';
import { isPremTrx } from 'modules/rating';
import {
  BIRCVCol,
  annualPremiumCol,
  bookingDateCol,
  buildingRCVCol,
  cancelEffDateCol,
  cancelReasonCol,
  contentsRCVCol,
  createdCol,
  dailyPremiumCol,
  deductibleCol,
  dwpCol,
  effectiveDateCol,
  eventId,
  expirationDateCol,
  externalIdCol,
  homeStateCol,
  idCol,
  inlandCategoryPremiumCol,
  issuingCarrierCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  locationIdCol,
  mailingAddress1Col,
  mailingAddress2Col,
  mailingAddressCol,
  mailingCityCol,
  mailingPostalCol,
  mailingStateCol,
  namedInsuredTrxCol,
  netDWPCol,
  netErrAdjCol,
  otherStructuresRCVCol,
  policyIdCol,
  premiumSubtotalCol,
  productCol,
  provisionalPremiumCol,
  ratingDataBasementCol,
  ratingDataCBRSCol,
  ratingDataConstructionCol,
  ratingDataDistToCoastFeetCol,
  ratingDataFloodZoneCol,
  ratingDataNumStoriesCol,
  ratingDataPriorLossCountCol,
  ratingDataPropertyCodeCol,
  ratingDataReplacementCostCol,
  ratingDataSqFootageCol,
  ratingDataTier1Col,
  ratingDataUnitsCol,
  ratingDataYearBuiltCol,
  subproducerAdjCol,
  subproducerCommissionCol,
  surgeCategoryPremiumCol,
  techInlandPremiumCol,
  techSurgePremiumCol,
  techTsunamiPremiumCol,
  termCol,
  termDaysCol,
  termPremiumCol,
  termProratedPctCol,
  tivCol,
  trxAdditionalNamedInsuredCol,
  trxCoordinatesCol,
  trxInterfaceTypeCol,
  trxLatitudeCol,
  trxLocationAddressLine1Col,
  trxLocationAddressLine2Col,
  trxLocationAddressSummaryCol,
  trxLocationCityCol,
  trxLocationCountyCol,
  trxLocationFIPSCol,
  trxLocationPostalCol,
  trxLocationStateCol,
  trxLongitudeCol,
  trxMGACommissionCol,
  trxMGACommissionPctCol,
  trxOtherInterestedPartiesCol,
  trxTimestamp,
  trxTypeCol,
  tsunamiCategoryPremiumCol,
  updatedCol,
} from './gridColumns';

export const transactionCols: GridColDef<Transaction>[] = [
  { ...idCol, headerName: 'Trx ID' },
  productCol,
  trxTypeCol,
  trxInterfaceTypeCol,
  policyIdCol,
  locationIdCol,
  externalIdCol,
  termCol,
  trxTimestamp,
  bookingDateCol,
  issuingCarrierCol,
  namedInsuredTrxCol,
  mailingAddressCol,
  mailingAddress1Col,
  mailingAddress2Col,
  mailingCityCol,
  mailingStateCol,
  mailingPostalCol,
  trxLocationAddressSummaryCol,
  trxLocationAddressLine1Col,
  trxLocationAddressLine2Col,
  trxLocationCityCol,
  trxLocationStateCol,
  trxLocationPostalCol,
  trxLocationCountyCol,
  trxLocationFIPSCol,
  trxCoordinatesCol,
  trxLatitudeCol,
  trxLongitudeCol,
  homeStateCol,
  {
    ...annualPremiumCol,
    field: 'locationAnnualPremium',
    headerName: 'Location Annual Premium',
  },
  termPremiumCol,
  {
    ...termDaysCol,
    field: 'trxDays',
    headerName: 'Trx. Days',
    valueGetter: ({ row }) => row.trxDays || null,
  },
  dailyPremiumCol,
  trxMGACommissionCol,
  trxMGACommissionPctCol,
  netDWPCol,
  termProratedPctCol,
  netErrAdjCol,
  {
    ...effectiveDateCol,
    field: 'trxEffDate',
    headerName: 'Trx. Eff. Date',
    valueGetter: ({ row }) => row.trxEffDate || null,
  },
  {
    ...expirationDateCol,
    field: 'trxExpDate',
    headerName: 'Trx. Exp. Date',
    valueGetter: ({ row }) => row.trxExpDate || null,
  },
  {
    ...effectiveDateCol,
    field: 'policyEffDate',
    headerName: 'Policy Eff. Date',
    valueGetter: ({ row }) => row.policyEffDate || null,
  },
  {
    ...expirationDateCol,
    field: 'policyExpDate',
    headerName: 'Policy Exp. Date',
    valueGetter: ({ row }) => row.policyExpDate || null,
  },
  cancelEffDateCol,
  cancelReasonCol,
  ratingDataReplacementCostCol,
  ratingDataDistToCoastFeetCol,
  ratingDataBasementCol,
  ratingDataNumStoriesCol,
  ratingDataPropertyCodeCol,
  ratingDataSqFootageCol,
  ratingDataYearBuiltCol,
  ratingDataFloodZoneCol,
  ratingDataCBRSCol,
  ratingDataUnitsCol,
  ratingDataTier1Col,
  ratingDataConstructionCol,
  ratingDataPriorLossCountCol,
  buildingRCVCol,
  otherStructuresRCVCol,
  contentsRCVCol,
  BIRCVCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  tivCol,
  deductibleCol,
  {
    ...techInlandPremiumCol,
    field: 'premiumCalcData.techPremium.inland',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.techPremium?.inland ?? null;
      return null;
    },
  },
  {
    ...techSurgePremiumCol,
    field: 'premiumCalcData.techPremium.surge',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.techPremium?.surge ?? null;
      return null;
    },
  },
  {
    ...techTsunamiPremiumCol,
    field: 'premiumCalcData.techPremium.tsunami',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.techPremium?.tsunami ?? null;
      return null;
    },
  },
  {
    ...inlandCategoryPremiumCol,
    field: 'premiumCalcData.floodCategoryPremium.inland',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.floodCategoryPremium?.inland ?? null;
      return null;
    },
  },
  {
    ...surgeCategoryPremiumCol,
    field: 'premiumCalcData.floodCategoryPremium.surge',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.floodCategoryPremium?.surge ?? null;
      return null;
    },
  },
  {
    ...tsunamiCategoryPremiumCol,
    field: 'premiumCalcData.floodCategoryPremium.tsunami',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.floodCategoryPremium?.tsunami ?? null;
      return null;
    },
  },
  {
    ...premiumSubtotalCol,
    field: 'premiumCalcData.premiumSubtotal',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.premiumSubtotal ?? null;
      return null;
    },
  },
  {
    ...provisionalPremiumCol,
    field: 'premiumCalcData.provisionalPremium',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.provisionalPremium ?? null;
      return null;
    },
  },
  {
    ...subproducerAdjCol,
    field: 'premiumCalcData.subproducerAdj',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.subproducerAdj ?? null;
      return null;
    },
  },
  {
    ...dwpCol,
    field: 'premiumCalcData.annualPremium',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.annualPremium ?? null;
      return null;
    },
  },
  {
    ...subproducerCommissionCol,
    field: 'premiumCalcData.subproducerCommissionPct',
    headerName: 'Subproducer Comm. Pct.',
    valueGetter: ({ row }) => {
      if (isPremTrx(row)) return row.premiumCalcData?.subproducerCommissionPct ?? null;
      return null;
    },
  },
  trxOtherInterestedPartiesCol,
  trxAdditionalNamedInsuredCol,
  eventId,
  createdCol,
  updatedCol,
];

export const TRANSACTION_COLUMN_VISIBILITY: GridColumnVisibilityModel = {
  id: false,
  trxInterfaceType: false,
  product: false,
  externalId: false,
  tiv: false,
  homeState: false,
  dailyPremium: false,
  'metadata.updated': false,
  'insuredLocation.address.addressLine1': false,
  'insuredLocation.address.addressLine2': false,
  'insuredLocation.address.city': false,
  'insuredLocation.address.state': false,
  'insuredLocation.address.postal': false,
  'insuredLocation.address.countyName': false,
  'insuredLocation.address.countyFIPS': false,
  'insuredLocation.coordinates.latitude': false,
  'insuredLocation.coordinates.longitude': false,
  'mailingAddress.addressLine1': false,
  'mailingAddress.addressLine2': false,
  'mailingAddress.city': false,
  'mailingAddress.state': false,
  'mailingAddress.postal': false,
};
