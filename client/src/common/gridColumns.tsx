import {
  AccountBalanceRounded,
  CachedRounded,
  CheckRounded,
  CloseRounded,
  CreditScoreRounded,
  DisabledByDefaultRounded,
  DoneRounded,
  FaceRounded,
  FiberNewRounded,
  FindInPageRounded,
  FloodRounded,
  HourglassBottomRounded,
  HourglassEmptyRounded,
  HourglassTopRounded,
  OpenInNewRounded,
  PendingRounded,
  QueryBuilderRounded,
  RequestQuoteRounded,
  StormRounded,
  ThumbDownRounded,
} from '@mui/icons-material';
import { Box, Chip, ChipProps, Typography } from '@mui/material';
import {
  GridRenderCellParams,
  GridValueGetterParams,
  GridAlignment,
  GridColDef,
  GridValueFormatterParams,
} from '@mui/x-data-grid';

import { FileLink, renderGridEmail, renderGridPhone } from 'components';
import { GridCellCopy } from 'components';
import {
  calcSum,
  formatGridCurrency,
  formatGridFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
  formatGridPercent,
  getGridAddressComponent,
  isCurrentDateBetween,
  numberFormat,
} from 'modules/utils';
import {
  AGENCY_SUBMISSION_STATUS,
  INVITE_STATUS,
  POLICY_STATUS,
  QUOTE_STATUS,
  SUBMISSION_STATUS,
} from './enums';
import { GeoPoint } from 'firebase/firestore';
import { AdditionalInsured, Address, Mortgagee, Nullable, PolicyLocation } from './types';
import { renderChips } from 'components/RenderGridCellHelpers';
// import { ADMIN_ROUTES, createPath } from 'router';

export const copyBaseProps: Partial<GridColDef> = {
  flex: 1,
  minWidth: 200,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const idCol: GridColDef = {
  field: 'id',
  headerName: 'ID',
  editable: false,
  ...copyBaseProps,
};

export const emailCol: GridColDef = {
  field: 'email',
  headerName: 'Email',
  flex: 1,
  minWidth: 220,
  editable: false,
  renderCell: (params) => renderGridEmail(params),
  // renderCell: (params: GridRenderCellParams<any, any, any>) => renderGridEmail(params),
};

export const phoneCol: GridColDef = {
  field: 'phone',
  headerName: 'Phone',
  minWidth: 160,
  flex: 1,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => renderGridPhone(params),
};

export const firstNameCol: GridColDef = {
  field: 'firstName',
  headerName: 'First Name',
  flex: 0.8,
  minWidth: 140,
  editable: false,
};

export const lastNameCol: GridColDef = {
  field: 'lastName',
  headerName: 'Last Name',
  flex: 0.8,
  minWidth: 120,
  editable: false,
};

export const displayNameCol: GridColDef = {
  field: 'displayName',
  headerName: 'Name',
  flex: 1,
  minWidth: 160,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) => {
    if (params.value) return params.value;
    if (params.row.firstName || params.row.lastName)
      return `${params.row.firstName} ${params.row.lastName}`.trim();
    return null;
  },
};

export const createdCol: GridColDef = {
  field: 'metadata.created',
  headerName: 'Created',
  minWidth: 160,
  flex: 0.6,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) => params.row.metadata?.created || null,
  valueFormatter: formatGridFirestoreTimestamp,
};

export const updatedCol: GridColDef = {
  field: 'metadata.updated',
  headerName: 'Updated',
  minWidth: 160,
  flex: 0.6,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) => params.row.metadata?.updated || null,
  valueFormatter: formatGridFirestoreTimestamp,
};

export const orgNameCol: GridColDef = {
  field: 'orgName',
  headerName: 'Org Name',
  minWidth: 220,
  flex: 1,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    if (!params.value) return null;
    return (
      <Typography variant='body2' color='text.primary' fontWeight='medium'>
        {params.value}
      </Typography>
    );
  },
};

export const agencyNameCol: GridColDef = {
  ...orgNameCol,
  field: 'agency.name',
  headerName: 'Agency',
  valueGetter: (params) => params.row.agency?.name || null,
};

export const orgIdCol: GridColDef = {
  field: 'orgId',
  headerName: 'Org ID',
  flex: 1,
  minWidth: 200,
  editable: false,
  // renderCell: (params: GridValueGetterParams<any, any>) => {
  //   if (!params.value) return null;
  //   return (
  //     <Link
  //       component={RouterLink} // TODO: non admin route
  //       to={createPath({ path: ADMIN_ROUTES.ORGANIZATION, params: { orgId: params.value } })}
  //       // to={`/orgs/${params.value}`}
  //       // to={createPath({
  //       //   path: ADMIN_ROUTES.SUBMISSION_VIEW,
  //       //   params: { submissionId: params.value },
  //       // })}
  //     >
  //       <GridCellCopy value={params.value} />
  //     </Link>
  //   );
  // },
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const fileLinkCol: GridColDef = {
  field: 'file',
  headerName: 'File',
  minWidth: 180,
  flex: 1,
  editable: false,
  renderCell: ({ value }: GridRenderCellParams<any, any, any>) => {
    if (!value) return null;

    return (
      <FileLink
        filepath={value}
        url={value}
        fileType='.pdf'
        typographyProps={{ variant: 'body2', fontWeight: 'fontWeightMedium' }}
        linkProps={{ underline: 'hover' }}
      />
    );
  },
};

const addressSummaryBase = {
  field: 'address',
  headerName: 'Address',
  minWidth: 260,
  flex: 1,
  editable: false,
};

const formatAddrSummary = (address?: Nullable<Address> | null | undefined) => {
  if (!address) return null;

  const { addressLine1, city, state } = address;
  if (!(addressLine1 || city || state)) return null;

  let formatted = '';
  if (addressLine1) formatted += `${addressLine1}`;
  if (city) formatted += `, ${city}`;
  if (state) formatted += `, ${state}`;

  return formatted;
};

export const addressSummaryCol: GridColDef = {
  ...addressSummaryBase,
  valueGetter: (params: GridValueGetterParams<any, any>) => formatAddrSummary(params.row.address),

  // const { addressLine1, city, state } = params.row.address;
  // if (!(addressLine1 || city || state)) return null;

  // let formatted = '';
  // if (addressLine1) formatted += `${addressLine1}`;
  // if (city) formatted += `, ${city}`;
  // if (state) formatted += `, ${state}`;

  // return formatted;
  // },
};

export const agencyAddressCol: GridColDef = {
  ...addressSummaryCol,
  field: 'agency.address',
  headerName: 'Agency Address',
  valueGetter: (params) => formatAddrSummary(params.row.agency?.address),
  // if (!params.row.agency?.address) return null;

  // const { addressLine1, city, state } = params.row.agency.address;
  // if (!(addressLine1 || city || state)) return null;

  // let formatted = '';
  // if (addressLine1) formatted += `${addressLine1}`;
  // if (city) formatted += `, ${city}`;
  // if (state) formatted += `, ${state}`;

  // return formatted;
  // },
};

export const address1Col: GridColDef = {
  field: 'addressLine1',
  headerName: 'Address 1',
  minWidth: 200,
  flex: 1,
  editable: false,
};

export const address2Col: GridColDef = {
  field: 'addressLine2',
  headerName: 'Suite / Unit',
  minWidth: 120,
  flex: 1,
  editable: false,
};

export const cityCol: GridColDef = {
  field: 'city',
  headerName: 'City',
  minWidth: 120,
  flex: 1,
  editable: false,
};

export const stateCol: GridColDef = {
  field: 'state',
  headerName: 'State',
  minWidth: 80,
  flex: 1,
  editable: false,
};

export const postalCol: GridColDef = {
  field: 'postal',
  headerName: 'Postal',
  minWidth: 100,
  flex: 1,
  editable: false,
};

export const countyCol: GridColDef = {
  field: 'countyName',
  headerName: 'County',
  minWidth: 160,
  flex: 1,
  editable: false,
};

export const fipsCol: GridColDef = {
  field: 'countyFIPS',
  headerName: 'FIPS',
  minWidth: 80,
  flex: 1,
  editable: false,
};

export const addrLine1Col: GridColDef = {
  ...address1Col,
  field: 'address.addressLine1',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    getGridAddressComponent(params, 'addressLine1'),
};

export const addrLine2Col: GridColDef = {
  ...address2Col,
  field: 'address.addressLine2',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    getGridAddressComponent(params, 'addressLine2'),
};

export const addrCityCol: GridColDef = {
  ...cityCol,
  field: 'address.city',
  valueGetter: (params: GridValueGetterParams<any, any>) => getGridAddressComponent(params, 'city'),
};

export const addrStateCol: GridColDef = {
  ...stateCol,
  field: 'address.state',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    getGridAddressComponent(params, 'state'),
};

export const addrPostalCol: GridColDef = {
  ...postalCol,
  field: 'address.postal',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    getGridAddressComponent(params, 'postal'),
};

export const addrCountyCol: GridColDef = {
  ...countyCol,
  field: 'address.countyName',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    getGridAddressComponent(params, 'countyName'),
};

export const addrFIPSCol: GridColDef = {
  ...fipsCol,
  field: 'address.countyFIPS',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    getGridAddressComponent(params, 'countyFIPS'),
};

export const latitudeCol: GridColDef = {
  field: 'latitude',
  headerName: 'Latitude',
  minWidth: 120,
  flex: 1,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.coordinates?.latitude || null,
};
export const longitudeCol: GridColDef = {
  field: 'longitude',
  headerName: 'Longitude',
  minWidth: 120,
  flex: 1,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.coordinates?.longitude || null,
};

export const coordinatesCol: GridColDef = {
  field: 'coordinates',
  headerName: 'Coordinates',
  minWidth: 220,
  flex: 0.5,
  editable: false,
  sortable: false,
  renderCell: (params: GridRenderCellParams<GeoPoint, any, any>) => {
    if (!params.value) return null;
    const latitude = params.value.latitude;
    const longitude = params.value.longitude;
    if (!(latitude && longitude)) return null;
    return (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography
          component='div'
          variant='body2'
          fontWeight={600}
          sx={{
            color: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.primary[300]
                : theme.palette.primary[600],
            '&:hover': {
              textDecoration: 'underline',
            },
            mr: 2,
          }}
          onClick={() =>
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`
            )
          }
        >
          {`[${latitude}, ${longitude}]`}
        </Typography>
        <OpenInNewRounded fontSize='small' />
      </Box>
    );
  },
  // TODO: get lat / lng from coordinates property
  // open in google maps on click
};

export const statusCol: GridColDef = {
  field: 'status',
  headerName: 'Status',
  type: 'singleSelect',
  // valueOptions: [
  //   SUBMISSION_STATUS.QUOTED,
  //   SUBMISSION_STATUS.SUBMITTED,
  //   SUBMISSION_STATUS.NOT_ELIGIBLE,
  //   SUBMISSION_STATUS.PENDING_INFO,
  //   SUBMISSION_STATUS.CANCELLED,
  //   SUBMISSION_STATUS.DRAFT,
  // ],
  // editable: true,
  // disableClickEventBubbling: true,
  minWidth: 160,
  flex: 0.6,

  renderCell: (params: GridRenderCellParams<any, any, any>) => (
    <Chip label={params.value} size='small' variant='outlined' {...getChipProps(params.value)} />
  ),
};

export type ChipStatus =
  | SUBMISSION_STATUS
  | QUOTE_STATUS
  | POLICY_STATUS
  | AGENCY_SUBMISSION_STATUS
  | INVITE_STATUS
  | string;

export function getChipProps(status: ChipStatus): Partial<ChipProps> {
  switch (status) {
    case SUBMISSION_STATUS.SUBMITTED:
      return { icon: <FiberNewRounded />, color: 'primary' };
    case SUBMISSION_STATUS.UNDER_REVIEW:
      return { icon: <FindInPageRounded />, color: 'warning' };
    case SUBMISSION_STATUS.DRAFT:
      return { icon: <PendingRounded />, color: 'info' };
    case SUBMISSION_STATUS.NOT_ELIGIBLE:
      return { icon: <ThumbDownRounded />, color: 'default' };
    case SUBMISSION_STATUS.PENDING_INFO:
      return { icon: <HourglassBottomRounded />, color: 'warning' };
    case SUBMISSION_STATUS.QUOTED:
      return { icon: <RequestQuoteRounded />, color: 'success' };
    case SUBMISSION_STATUS.CANCELLED:
      return { icon: <CloseRounded />, color: 'default' };
    case QUOTE_STATUS.AWAITING_USER:
      return { icon: <HourglassEmptyRounded />, color: 'primary' };
    case QUOTE_STATUS.BOUND:
      return { icon: <DoneRounded />, color: 'success' };
    case QUOTE_STATUS.EXPIRED:
      return { icon: <HourglassBottomRounded />, color: 'warning' };
    case QUOTE_STATUS.CANCELLED:
      return { icon: <CloseRounded />, color: 'default' };
    case POLICY_STATUS.PAID:
      return { icon: <CreditScoreRounded />, color: 'success' };
    case POLICY_STATUS.PAYMENT_PROCESSING:
      return { icon: <CachedRounded />, color: 'info' };
    case POLICY_STATUS.AWAITING_PAYMENT:
      return { icon: <HourglassTopRounded />, color: 'warning' };
    case POLICY_STATUS.CANCELLED:
      return { icon: <CloseRounded />, color: 'default' };
    case INVITE_STATUS.PENDING: // NEVER REACH HERE MATCHES PENDING ABOVE ^^
      return { icon: <QueryBuilderRounded />, color: 'warning' };
    case INVITE_STATUS.ACCECPTED:
      return { icon: <CheckRounded />, color: 'success' };
    case 'active':
      return { icon: <CheckRounded />, color: 'success' };
    case 'inactive':
      return { icon: <DisabledByDefaultRounded />, color: 'default' };
    default:
      return { color: 'default' };
  }
}

export const booleanCalcActiveCol: GridColDef = {
  field: 'active',
  headerName: 'Active',
  type: 'boolean',
  description: 'Current date is after effective date (if exists) and before expiration (if exists)',
  minWidth: 80,
  flex: 0.5,
  headerAlign: 'center',
  align: 'center' as GridAlignment,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    isCurrentDateBetween(params.row.effectiveDate?.toDate(), params.row.expirationDate?.toDate()),
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    const isActive = !!params.value;

    if (isActive) return <CheckRounded color='success' fontSize='small' />;
    return <CloseRounded color='disabled' fontSize='small' />;
  },
};

export const effectiveDateCol: GridColDef = {
  field: 'effectiveDate',
  headerName: 'Effective Date',
  type: 'date',
  minWidth: 180,
  flex: 1,
  editable: false,
  valueGetter: (params) => params.row.effectiveDate || null,
  valueFormatter: formatGridFirestoreTimestampAsDate,
};

export const expirationDateCol: GridColDef = {
  field: 'expirationDate',
  headerName: 'Expiration Date',
  type: 'date',
  minWidth: 180,
  flex: 1,
  editable: false,
  valueGetter: (params) => params.row.expirationDate || null,
  valueFormatter: formatGridFirestoreTimestampAsDate,
};

export const currencyCol: GridColDef = {
  field: 'currency',
  headerName: 'Currency',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: (params) => formatGridCurrency(params, '$0,0.00'),
  renderCell: (params) => (
    <Typography variant='body2' fontWeight='medium'>
      {params.formattedValue}
    </Typography>
  ),
};

export const limitACol: GridColDef = {
  field: 'limitA',
  headerName: 'Limit A',
  description: 'Coverage A limit (building)',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueGetter: (params) => params.row.limits?.limitA ?? null,
  valueFormatter: formatGridCurrency,
};

export const limitBCol: GridColDef = {
  field: 'limitB',
  headerName: 'Limit B',
  description: 'Coverage B limit (Additional structures)',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueGetter: (params) => params.row.limits?.limitB ?? null,
  valueFormatter: formatGridCurrency,
};

export const limitCCol: GridColDef = {
  field: 'limitC',
  headerName: 'Limit C',
  description: 'Coverage C limit (contents)',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueGetter: (params) => params.row.limits?.limitC ?? null,
  valueFormatter: formatGridCurrency,
};

export const limitDCol: GridColDef = {
  field: 'limitD',
  headerName: 'Limit D',
  description: 'Coverage D limit (living expenses)',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueGetter: (params) => params.row.limits?.limitD ?? null,
  valueFormatter: formatGridCurrency,
};

export const tivCol: GridColDef = {
  field: 'tiv',
  headerName: 'TIV',
  description: 'Sum of coverage limits',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueGetter: (params) => {
    if (params.row.tiv) return params.row.tiv;
    if (params.row.limits?.tiv) return params.row.limits.tiv;

    const limits = params.row.limits;
    if (!limits) return null;
    try {
      const tiv = calcSum(Object.values(limits));
      return tiv;
    } catch (err) {
      return null;
    }
  },
  valueFormatter: formatGridCurrency,
};

// TODO: TIV COLUMN

export const deductibleCol: GridColDef = {
  field: 'deductible',
  headerName: 'Deductible',
  minWidth: 100,
  flex: 0.5,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: formatGridCurrency,
};

export const namedInsuredDisplayNameCol: GridColDef = {
  field: 'namedInsured.displayName',
  headerName: 'Named Insured',
  minWidth: 160,
  flex: 0.8,
  editable: false,
  valueGetter: (params: GridValueGetterParams) =>
    `${params.row.namedInsured?.firstName || ''} ${
      params.row.namedInsured?.lastName || ''
    }`.trim() || null,
};

export const namedInsuredFirstNameCol: GridColDef = {
  ...firstNameCol,
  field: 'namedInsured.firstName',
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.firstName || null,
};

export const namedInsuredLastNameCol: GridColDef = {
  ...lastNameCol,
  field: 'namedInsured.lastName',
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.lastName || null,
};

export const namedInsuredEmailCol: GridColDef = {
  ...emailCol,
  field: 'namedInsured.email',
  headerName: 'Insured Email',
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.email || null,
};

export const namedInsuredPhoneCol: GridColDef = {
  ...phoneCol,
  field: 'namedInsured.phone',
  headerName: 'Insured Phone',
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.phone || null,
};

export const replacementCostCol: GridColDef = {
  field: 'replacementCost',
  headerName: 'Replacement Cost',
  description: 'Building replacement cost',
  minWidth: 140,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: formatGridCurrency,
};

export const ratingDataReplacementCostCol: GridColDef = {
  ...replacementCostCol,
  valueGetter: (params) => params.row.ratingPropertyData?.replacementCost ?? null,
};

export const subproducerCommissionCol: GridColDef = {
  field: 'subproducerCommission',
  headerName: 'Commission',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: (params) => formatGridPercent(params, 0),
};

export const propertyCodeCol: GridColDef = {
  field: 'propertyCode',
  headerName: 'Property Code',
  minWidth: 140,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
};

export const ratingDataPropertyCodeCol: GridColDef = {
  ...propertyCodeCol,
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.ratingPropertyData?.propertyCode ?? null,
};

export const yearBuiltCol: GridColDef = {
  field: 'yearBuilt',
  headerName: 'Year Built',
  description: 'Year built provided by property api',
  minWidth: 140,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
};

export const ratingDataYearBuiltCol: GridColDef = {
  ...yearBuiltCol,
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.ratingPropertyData?.yearBuilt ?? null,
};

export const sqFootageCol: GridColDef = {
  field: 'sqFootage',
  headerName: 'Sq. Footage',
  minWidth: 140,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: (params: GridValueFormatterParams<number>) =>
    params.value ? numberFormat(params.value) : null,
};

export const ratingDataSqFootageCol: GridColDef = {
  ...sqFootageCol,
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.ratingPropertyData?.sqFootage ?? null,
};

export const numStoriesCol: GridColDef = {
  field: 'numStories',
  headerName: 'Num. Stories',
  minWidth: 100,
  flex: 0.4,
  headerAlign: 'center',
  align: 'right',
};

export const ratingDataNumStoriesCol: GridColDef = {
  ...numStoriesCol,
  valueGetter: (params) => params.row.ratingPropertyData?.numStories ?? null,
};

export const basementCol: GridColDef = {
  field: 'basement',
  headerName: 'Basement',
  minWidth: 140,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
};

export const ratingDataBasementCol: GridColDef = {
  ...basementCol,
  valueGetter: (params) => params.row.ratingPropertyData?.basement ?? null,
};

export const distToCoastFeetCol: GridColDef = {
  field: 'distToCoastFeet',
  headerName: 'Dist. to Coast (ft.)',
  minWidth: 160,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: (params: GridValueFormatterParams<number>) =>
    params.value ? numberFormat(params.value) : null,
};

export const ratingDataDistToCoastFeetCol: GridColDef = {
  ...distToCoastFeetCol,
  valueGetter: (params) => params.row.ratingPropertyData?.distToCoastFeet ?? null,
};

export const CBRSCol: GridColDef = {
  field: 'CBRSDesignation',
  headerName: 'CBRS Des.',
  description: 'Coastal Barrier Reef System Designation provided by property api',
  minWidth: 100,
  flex: 0.5,
  headerAlign: 'center',
  align: 'right',
};

export const ratingDataCBRSCol: GridColDef = {
  ...CBRSCol,
  valueGetter: (params) => params.row.ratingPropertyData?.CBRSDesignation ?? null,
};

export const floodZoneCol: GridColDef = {
  field: 'floodZone',
  headerName: 'Flood Zone',
  minWidth: 100,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
};

export const ratingDataFloodZoneCol: GridColDef = {
  ...floodZoneCol,
  valueGetter: (params) => params.row.ratingPropertyData?.floodZone ?? null,
};

export const priorLossCountCol: GridColDef = {
  field: 'priorLossCount',
  headerName: 'Prior Losses',
  description: 'Prior loss count provided by user',
  minWidth: 100,
  flex: 0.4,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  // TODO: valueFormatter
};

export const ratingDataPriorLossCountCol: GridColDef = {
  ...priorLossCountCol,
  valueGetter: (params) => params.row.ratingPropertyData?.priorLossCount ?? null,
};

export const userIdCol: GridColDef = {
  field: 'userId',
  headerName: 'User ID',
  ...copyBaseProps,
};

export const agentNameCol: GridColDef = {
  field: 'agentName',
  headerName: 'Agent Name',
  minWidth: 180,
  flex: 0.8,
  editable: false,
};

export const nestedAgentNameCol: GridColDef = {
  ...agentNameCol,
  field: 'agent.name',
  valueGetter: (params: GridValueGetterParams<any, any>) => params.row.agent?.name || null,
};

export const agentEmailCol: GridColDef = {
  ...emailCol,
  field: 'agent.email',
  headerName: 'Agent Email',
  valueGetter: (params) => params.row.agent?.email || null,
};

export const agentPhoneCol: GridColDef = {
  ...phoneCol,
  field: 'agent.phone',
  headerName: 'Agent Phone',
  valueGetter: (params) => params.row.agent?.phone || null,
};

export const agentIdCol: GridColDef = {
  field: 'agentId',
  headerName: 'Agent ID',
  ...copyBaseProps,
};

export const nestedAgentUserIdCol: GridColDef = {
  ...agentIdCol,
  field: 'agent.userId',
  valueGetter: (params: GridValueGetterParams) => params.row.agent?.userId || null,
  ...copyBaseProps,
};

export const agencyIdCol: GridColDef = {
  field: 'agencyId',
  headerName: 'Agency ID',
  ...copyBaseProps,
};

export const nestedAgencyOrgIdCol: GridColDef = {
  ...agencyIdCol,
  field: 'agency.orgId',
  valueGetter: (params: GridValueGetterParams) => params.row.agency?.orgId || null,
};

export const inlandAALCol: GridColDef = {
  field: 'AAL.inland',
  headerName: 'Inland AAL',
  description: 'Inland Peril Average Annual Loss from Swiss Re',
  minWidth: 150,
  flex: 0.8,
  valueGetter: (params) => params.row.AAL?.inland ?? null,
  renderCell: (params) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const surgeAALCol: GridColDef = {
  field: 'AAL.surge',
  headerName: 'Surge AAL',
  description: 'Surge Peril Average Annual Loss from Swiss Re',
  minWidth: 150,
  flex: 0.8,
  valueGetter: (params) => params.row.AAL?.surge ?? null,
  renderCell: (params) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const tsunamiAALCol: GridColDef = {
  field: 'AAL.tsunami',
  headerName: 'Tsunami AAL',
  description: 'Tsunami Peril Average Annual Loss from Swiss Re',
  minWidth: 150,
  flex: 0.8,
  valueGetter: (params) => params.row.AAL?.tsunami ?? null,
  renderCell: (params) => <GridCellCopy value={params.value} />,
};

export const annualPremiumCol: GridColDef = {
  field: 'annualPremium',
  headerName: 'Annual Premium',
  description: 'Annual premium before taxes and fees',
  minWidth: 140,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: formatGridCurrency,
};

// TODO: delete termPremium ?? same as annual ?? or term is pro-rated ??
export const termPremiumCol: GridColDef = {
  field: 'termPremium',
  headerName: 'Term Premium',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: formatGridCurrency,
};

export const locationsCount: GridColDef = {
  field: 'locationsCount',
  headerName: '# locations',
  minWidth: 100,
  flex: 0.5,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  valueGetter: (params) => {
    if (!params.row.locations) return null;
    return Object.keys(params.row.locations).length;
  },
};

export const locationAddresses: GridColDef = {
  field: 'addressesSummary',
  headerName: 'Locations',
  minWidth: 300,
  flex: 1.5,
  editable: false,
  valueGetter: (params) => {
    if (!params.row.locations) return null;

    const locations = Object.values(params.row.locations) as PolicyLocation[];
    return locations.map((l) => l.address || null).filter((x) => x);
  },
  renderCell: (params) => {
    if (!params.value || !params.value.length) return null;
    let addr1 = params.value[0] as Address;
    let addrSummary = `${addr1.addressLine1}, ${addr1.city}, ${addr1.state}`;
    let additionalCount = params.value.length - 1;

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', maxWidth: '100%' }}>
        <Typography
          variant='body2'
          sx={{
            mr: 1,
            flex: '0 1 auto',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}
        >{`${addrSummary}`}</Typography>
        {additionalCount ? (
          <Typography
            variant='body2'
            fontSize='0.775rem'
            fontWeight={500}
          >{`+ ${additionalCount} more`}</Typography>
        ) : null}
      </Box>
    );
  },
};

export const homeStateCol: GridColDef = {
  field: 'homeState',
  headerName: 'Home State',
  minWidth: 100,
  flex: 0.4,
  editable: false,
};

export const productCol: GridColDef = {
  field: 'product',
  headerName: 'Product',
  minWidth: 100,
  flex: 0.4,
  editable: false,
};

function getProductChipProps(value: string): Partial<ChipProps> {
  switch (value) {
    case 'flood':
      return { icon: <FloodRounded />, color: 'primary' };
    case 'wind':
      return { icon: <StormRounded />, color: 'secondary' };
    default:
      return { color: 'default' };
  }
}

export const productsCol: GridColDef = {
  field: 'products',
  headerName: 'Products',
  minWidth: 180,
  flex: 1,
  editable: false,
  renderCell: (params) =>
    renderChips(params, { variant: 'outlined', color: 'success' }, getProductChipProps),
};

export const SLProducerOfRecordNameCol: GridColDef = {
  field: 'SLProducerOfRecord.name',
  headerName: 'SL PofR',
  minWidth: 200,
  flex: 0.6,
  editable: false,
  description: 'Surplus Lines Producer of Record',
  valueGetter: (params) => params.row.surplusLinesProducerOfRecord?.name || null,
};

export const SLProducerOfRecordLicenseNum: GridColDef = {
  ...copyBaseProps,
  field: 'SLProducerOfRecord.licenseNum',
  headerName: 'SL PofR License',
  description: 'Surplus Lines Producer of Record license number',
  valueGetter: (params) => params.row.surplusLinesProducerOfRecord?.licenseNum || null,
};

export const SLProducerOfRecordLicenseState: GridColDef = {
  field: 'SLProducerOfRecord.licenseState',
  headerName: 'SL PofR License State',
  description: 'Surplus Lines Producer of Record license state',
  valueGetter: (params) => params.row.surplusLinesProducerOfRecord?.licenseState || null,
};

export const SLProducerOfRecordLicensePhone: GridColDef = {
  ...phoneCol,
  field: 'SLProducerOfRecord.phone',
  headerName: 'SL PofR License Phone',
  description: 'Surplus Lines Producer of Record license provided phone number',
  valueGetter: (params) => params.row.surplusLinesProducerOfRecord?.phone || null,
};

export const SLProducerOfRecordLicenseAddress: GridColDef = {
  ...addressSummaryBase,
  field: 'SLProducerOfRecord.address',
  headerName: 'SL PofR License Address',
  description: 'Surplus Lines Producer of Record license provided address',
  valueGetter: (params) => formatAddrSummary(params.row.surplusLinesProducerOfRecord?.address),
};

export const issuingCarrierCol: GridColDef = {
  field: 'issuingCarrier',
  headerName: 'Carrier',
  minWidth: 180,
  flex: 0.6,
  editable: false,
};

export const additionalInsuredsCol: GridColDef = {
  field: 'additionalInsureds',
  headerName: 'Additional Insureds',
  minWidth: 260,
  flex: 1,
  editable: false,
  valueGetter: (params) =>
    params.row.additionalInsureds?.map((ai: AdditionalInsured) => ai.name) || null,
  renderCell: (params) =>
    renderChips(params, { variant: 'outlined', color: 'success', icon: <FaceRounded /> }),
  // renderCell: (params) => {
  //   if (!params.value || !params.value.length) return null;

  //   return (
  //     <Stack direction='row' spacing={1} sx={{ minWidth: 0 }}>
  //       {params.value.map((ai: AdditionalInsured) => {
  //         let icon = <FaceRounded fontSize='small' />; // ai.type === 'x" ? <icon1 /> : <othericon />
  //         const color = 'primary'; // TODO: check AI type

  //         return <Chip label={ai.name} icon={icon} size='small' color={color} variant='outlined' />;
  //       })}
  //     </Stack>
  //   );
  // },
};

export const mortgageeCol: GridColDef = {
  field: 'mortgageeInterest',
  headerName: 'Mortgagee',
  minWidth: 260,
  flex: 1,
  editable: false,
  valueGetter: (params) => params.row.mortgageeInterest?.map((m: Mortgagee) => m.name) || null,
  renderCell: (params) =>
    renderChips(params, { variant: 'outlined', color: 'info', icon: <AccountBalanceRounded /> }),
  // renderCell: (params) => {
  //   if (!params.value || !params.value.length) return null;

  //   return (
  //     <Stack direction='row' spacing={1} sx={{ minWidth: 0 }}>
  //       {params.value.map((ai: AdditionalInsured) => {
  //         let icon = <FaceRounded fontSize='small' />; // ai.type === 'x" ? <icon1 /> : <othericon />
  //         const color = 'primary'; // TODO: check AI type

  //         return <Chip label={ai.name} icon={icon} size='small' color={color} variant='outlined' />;
  //       })}
  //     </Stack>
  //   );
  // },
};

export const externalIdCol: GridColDef = {
  ...idCol,
  field: 'externalId',
  headerName: 'External ID',
};

export const ratingDocIdCol: GridColDef = {
  ...idCol,
  field: 'ratingDocId',
  headerName: 'Rating Doc ID',
};

export const subjectBaseCol: GridColDef = {
  field: 'subjectBase',
  headerName: 'Subject Base',
  minWidth: 340,
  flex: 1,
  editable: false,
  renderCell: renderChips,
};

export const policyTrxTypesCol: GridColDef = {
  field: 'transactionTypes',
  headerName: 'Transaction Types',
  minWidth: 340,
  flex: 1,
  editable: false,
  renderCell: (params) => renderChips(params, { variant: 'outlined', color: 'success' }),
};

export const LOBCol: GridColDef = {
  field: 'LOB',
  headerName: 'LOB',
  minWidth: 200,
  flex: 0.6,
  editable: false,
  renderCell: (params) => renderChips(params, { variant: 'outlined' }),
};
