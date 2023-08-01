import { Box, Chip, ChipProps, Typography } from '@mui/material';
import {
  AccountBalanceRounded,
  CachedRounded,
  CancelRounded,
  CancelScheduleSendRounded,
  CheckRounded,
  CloseRounded,
  CreditScoreRounded,
  DisabledByDefaultRounded,
  DoneRounded,
  EmailRounded,
  ErrorOutlineRounded,
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
import {
  GridRenderCellParams,
  GridValueGetterParams,
  GridAlignment,
  GridColDef,
  GridValueFormatterParams,
  GridCellParams,
  GridTreeNode,
  GridSingleSelectColDef,
} from '@mui/x-data-grid';
import { GeoPoint, Timestamp } from 'firebase/firestore';
import { isDate } from 'lodash';
import { toast } from 'react-hot-toast';

import { FileLink, renderGridEmail, renderGridPhone } from 'components';
import { GridCellCopy } from 'components';
import {
  calcSum,
  formatFirestoreTimestamp,
  formatGridCurrency,
  formatGridFirestoreTimestampAsDate,
  formatGridPercent,
  getGridAddressComponent,
  isCurrentDateBetween,
  numberFormat,
  popUpWasBlocked,
} from 'modules/utils';
import {
  AGENCY_SUBMISSION_STATUS,
  INVITE_STATUS,
  POLICY_STATUS,
  QUOTE_STATUS,
  SUBMISSION_STATUS,
  AdditionalInsured,
  Address,
  Mortgagee,
  Nullable,
  PolicyLocation,
  CHANGE_REQUEST_STATUS,
} from 'common';
import { renderChip, renderChips, renderSplitSnakeCase } from 'components/RenderGridCellHelpers';
import { STATES_ABV_ARR } from '../../../common/statesList';
import {
  getGridFirestoreNumericOperators,
  getGridFirestoreDateOperators,
  getGridFirestoreStringOperators,
  getGridFirestoreSelectOperators,
  getGridFirestoreBooleanOperators,
  // GRID_MULTI_SELECT_COL_DEF,
} from 'modules/muiGrid/operators';
import {
  CBRS_OPTIONS,
  FLOOD_ZONE_OPTIONS,
  LOB_OPTIONS,
  PRIOR_LOSS_COUNT_OPTIONS,
  PRODUCT_OPTIONS,
} from '../../../common/constants';
import { multiSelectExtendsSingle } from 'modules/muiGrid/gridMultiSelectColDef';
import { TRANSACTION_OPTIONS } from 'elements/forms/TaxForm';

export const copyBaseProps: Partial<GridColDef> = {
  flex: 1.2,
  minWidth: 200,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    if (!params.value) return null;
    return <GridCellCopy value={params.value} />;
  },
};

export const idCol: GridColDef = {
  field: 'id',
  headerName: 'ID',
  type: 'string',
  editable: false,
  filterable: false,
  sortable: false,
  filterOperators: getGridFirestoreStringOperators(),
  ...copyBaseProps,
};

export const emailCol: GridColDef = {
  field: 'email',
  headerName: 'Email',
  type: 'string',
  flex: 1,
  minWidth: 220,
  editable: false,
  renderCell: (params) => renderGridEmail(params),
  filterOperators: getGridFirestoreStringOperators(),
  // renderCell: (params: GridRenderCellParams<any, any, any>) => renderGridEmail(params),
};

export const phoneCol: GridColDef = {
  field: 'phone',
  headerName: 'Phone',
  type: 'string',
  minWidth: 160,
  flex: 1,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => renderGridPhone(params),
  filterOperators: getGridFirestoreStringOperators(),
};

export const firstNameCol: GridColDef = {
  field: 'firstName',
  headerName: 'First Name',
  type: 'string',
  flex: 0.8,
  minWidth: 140,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
};

export const lastNameCol: GridColDef = {
  field: 'lastName',
  headerName: 'Last Name',
  type: 'string',
  flex: 0.8,
  minWidth: 120,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
};

export const displayNameCol: GridColDef = {
  field: 'displayName',
  headerName: 'Name',
  type: 'string',
  flex: 1,
  minWidth: 160,
  editable: false,
  filterable: false,
  sortable: false,
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
  type: 'date',
  minWidth: 160,
  flex: 0.6,
  editable: false,
  // disableExport: true,
  filterOperators: getGridFirestoreDateOperators(),
  valueGetter: (params: GridValueGetterParams<any, any>) => params.row.metadata?.created || null,
  valueParser: (value: any, params?: GridCellParams<any, any, any, GridTreeNode> | undefined) => {
    console.log('VAL SETTER: ', value, params);
    if (!value) return null;
    console.log('is date: ', isDate(value));
    if (isDate(value)) return Timestamp.fromDate(new Date(value));
    return value;
  },
  // valueFormatter: formatGridFirestoreTimestamp,
  valueFormatter: formatGridFirestoreTimestampAsDate,
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    if (!(params.value && params.value.seconds)) return null;
    return (
      <Typography variant='body2' color='text.secondary'>
        {formatFirestoreTimestamp(params.value)}
      </Typography>
    );
  },
  // valueSetter: (params) => {
  //   console.log('VALUE SETTER PARAMS: ', params);
  //   if (!params.value) return null;
  //   let isD = !isDate(params.value);
  //   console.log('IS DATE ', isD);
  //   // if (isD) {
  //   //   console.log('RETURNING TIMESTAMP ');
  //   //   return Timestamp.fromDate(new Date(params.value));
  //   // }
  //   return null;
  // },
};

export const updatedCol: GridColDef = {
  field: 'metadata.updated',
  headerName: 'Updated',
  type: 'date',
  minWidth: 160,
  flex: 0.6,
  editable: false,
  // disableExport: true,
  filterOperators: getGridFirestoreDateOperators(),
  valueGetter: (params: GridValueGetterParams<any, any>) => params.row.metadata?.updated || null,
  // valueFormatter: formatGridFirestoreTimestamp,
  valueFormatter: formatGridFirestoreTimestampAsDate,
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    if (!(params.value && params.value.seconds)) return null;
    return (
      <Typography variant='body2' color='text.secondary'>
        {formatFirestoreTimestamp(params.value)}
      </Typography>
    );
  },
};

export const orgNameCol: GridColDef = {
  field: 'orgName',
  headerName: 'Org Name',
  type: 'string',
  minWidth: 220,
  flex: 1,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
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
  filterOperators: getGridFirestoreStringOperators(),
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
  filterable: false,
  sortable: false,
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
  filterable: false,
  sortable: false,
};

const formatAddrSummary = (address?: Nullable<Address> | null | undefined, withLine2?: boolean) => {
  if (!address) return null;

  const { addressLine1, addressLine2, city, state } = address;
  if (!(addressLine1 || city || state)) return null;

  let formatted = '';
  if (addressLine1) formatted += `${addressLine1}`;
  if (addressLine2 && withLine2) formatted += ` ${addressLine2}`;
  if (city) formatted += `, ${city}`;
  if (state) formatted += `, ${state}`;

  return formatted;
};

export const addressSummaryCol: GridColDef = {
  ...addressSummaryBase,
  valueGetter: (params: GridValueGetterParams<any, any>) => formatAddrSummary(params.row.address),
  valueFormatter: ({ value }) => {
    if (value) return formatAddrSummary(value, true);
    return '';
  },
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
  filterable: false,
  sortable: false,
  valueGetter: (params) => formatAddrSummary(params.row.agency?.address),
};

export const address1Col: GridColDef = {
  field: 'addressLine1',
  headerName: 'Address 1',
  type: 'string',
  minWidth: 200,
  flex: 1,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
};

export const address2Col: GridColDef = {
  field: 'addressLine2',
  headerName: 'Suite / Unit',
  type: 'string',
  minWidth: 120,
  flex: 1,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
};

export const cityCol: GridColDef = {
  field: 'city',
  headerName: 'City',
  type: 'string',
  minWidth: 120,
  flex: 1,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
};

export const stateCol: GridSingleSelectColDef = {
  field: 'state',
  headerName: 'State',
  type: 'singleSelect',
  minWidth: 80,
  flex: 1,
  editable: false,
  valueOptions: STATES_ABV_ARR,
  filterOperators: getGridFirestoreSelectOperators(),
};

export const postalCol: GridColDef = {
  field: 'postal',
  headerName: 'Postal',
  type: 'string',
  minWidth: 100,
  flex: 1,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
};

export const countyCol: GridColDef = {
  field: 'countyName',
  headerName: 'County',
  type: 'string',
  minWidth: 160,
  flex: 1,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
};

export const fipsCol: GridColDef = {
  field: 'countyFIPS',
  headerName: 'FIPS',
  type: 'string',
  minWidth: 80,
  flex: 1,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
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
  type: 'number',
  minWidth: 120,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.coordinates?.latitude || null,
};
export const longitudeCol: GridColDef = {
  field: 'longitude',
  headerName: 'Longitude',
  minWidth: 120,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  filterOperators: getGridFirestoreNumericOperators(),
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
  filterable: false,
  disableExport: true,
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
          onClick={() => {
            const w = window.open(
              `https://www.google.com/maps/search/?api=1&query=${latitude}%2C${longitude}`
            );
            if (popUpWasBlocked(w)) toast.error('Please allow the new window to view Google Maps');
          }}
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

export const statusCol: GridSingleSelectColDef = {
  field: 'status',
  headerName: 'Status',
  type: 'singleSelect',
  // valueOptions: [
  //   SUBMISSION_STATUS.QUOTED,
  //   SUBMISSION_STATUS.SUBMITTED,
  // ],
  minWidth: 160,
  flex: 0.6,
  editable: false,
  filterable: false,
  sortable: false,
  filterOperators: getGridFirestoreSelectOperators(),
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    if (!params.value) return null;
    return (
      <Chip label={params.value} size='small' variant='outlined' {...getChipProps(params.value)} />
    );
  },
};

export type ChipStatus =
  | SUBMISSION_STATUS
  | QUOTE_STATUS
  | POLICY_STATUS
  | AGENCY_SUBMISSION_STATUS
  | INVITE_STATUS
  | CHANGE_REQUEST_STATUS
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
    case INVITE_STATUS.PENDING: // NEVER REACH HERE MATCHES PENDING ABOVE
      return { icon: <QueryBuilderRounded />, color: 'warning' };
    case INVITE_STATUS.ACCEPTED:
      return { icon: <CheckRounded />, color: 'success' };
    case CHANGE_REQUEST_STATUS.DENIED:
      return { icon: <CloseRounded />, color: 'error' };
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
  filterable: false,
  sortable: false,
  filterOperators: getGridFirestoreBooleanOperators(), //  getGridFirebaseBooleanOperators(),
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
  filterOperators: getGridFirestoreDateOperators(),
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
  filterOperators: getGridFirestoreDateOperators(),
};

export const currencyCol: GridColDef = {
  field: 'currency',
  headerName: 'Currency',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueFormatter: (params) => formatGridCurrency(params, '$0,0.00'),
  renderCell: (params) => (
    <Typography variant='body2' fontWeight='medium'>
      {params.formattedValue}
    </Typography>
  ),
};

export const limitACol: GridColDef = {
  field: 'limits.limitA',
  headerName: 'Limit A',
  description: 'Coverage A limit (building)',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.limits?.limitA ?? null,
  valueFormatter: formatGridCurrency,
};

export const limitBCol: GridColDef = {
  field: 'limits.limitB',
  headerName: 'Limit B',
  description: 'Coverage B limit (Additional structures)',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.limits?.limitB ?? null,
  valueFormatter: formatGridCurrency,
};

export const limitCCol: GridColDef = {
  field: 'limits.limitC',
  headerName: 'Limit C',
  description: 'Coverage C limit (contents)',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.limits?.limitC ?? null,
  valueFormatter: formatGridCurrency,
};

export const limitDCol: GridColDef = {
  field: 'limits.limitD',
  headerName: 'Limit D',
  description: 'Coverage D limit (living expenses)',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.limits?.limitD ?? null,
  valueFormatter: formatGridCurrency,
};

export const tivCol: GridColDef = {
  field: 'tiv',
  headerName: 'TIV',
  description: 'Total Insured Value - sum of coverage limits',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterable: false, // could be calculated value
  sortable: false,
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
  type: 'number',
  minWidth: 100,
  flex: 0.5,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueFormatter: formatGridCurrency,
};

export const namedInsuredDisplayNameCol: GridColDef = {
  field: 'namedInsured.displayName',
  headerName: 'Named Insured',
  minWidth: 160,
  flex: 0.8,
  editable: false,
  filterable: false,
  sortable: false,
  valueGetter: (params: GridValueGetterParams) =>
    `${params.row.namedInsured?.firstName || ''} ${
      params.row.namedInsured?.lastName || ''
    }`.trim() || null,
};

export const namedInsuredFirstNameCol: GridColDef = {
  ...firstNameCol,
  field: 'namedInsured.firstName',
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.firstName || null,
  filterOperators: getGridFirestoreStringOperators(),
  // filterOperators: getGridFirestoreStringOperators(),
};

export const namedInsuredLastNameCol: GridColDef = {
  ...lastNameCol,
  field: 'namedInsured.lastName',
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.lastName || null,
  filterOperators: getGridFirestoreStringOperators(),
};

export const namedInsuredEmailCol: GridColDef = {
  ...emailCol,
  field: 'namedInsured.email',
  headerName: 'Insured Email',
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.email || null,
  filterOperators: getGridFirestoreStringOperators(),
};

export const namedInsuredPhoneCol: GridColDef = {
  ...phoneCol,
  field: 'namedInsured.phone',
  headerName: 'Insured Phone',
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.phone || null,
  filterOperators: getGridFirestoreStringOperators(),
};

export const replacementCostCol: GridColDef = {
  field: 'replacementCost',
  headerName: 'Replacement Cost',
  description: 'Building replacement cost',
  type: 'number',
  minWidth: 140,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: formatGridCurrency,
  filterOperators: getGridFirestoreNumericOperators(),
};

export const ratingDataReplacementCostCol: GridColDef = {
  ...replacementCostCol,
  field: 'ratingPropertyData.replacementCost',
  valueGetter: (params) => params.row.ratingPropertyData?.replacementCost ?? null,
};

export const subproducerCommissionCol: GridColDef = {
  field: 'subproducerCommission',
  headerName: 'Commission',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueFormatter: (params) => formatGridPercent(params, 0),
};

export const propertyCodeCol: GridColDef = {
  field: 'propertyCode',
  headerName: 'Property Code',
  minWidth: 140,
  flex: 0.8,
  // headerAlign: 'center',
  // align: 'right',
  filterOperators: getGridFirestoreStringOperators(),
};

export const ratingDataPropertyCodeCol: GridColDef = {
  ...propertyCodeCol,
  field: 'ratingPropertyData.propertyCode',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.ratingPropertyData?.propertyCode ?? null,
};

export const yearBuiltCol: GridColDef = {
  field: 'yearBuilt',
  headerName: 'Year Built',
  description: 'Year built provided by property api',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueFormatter: (params: GridValueFormatterParams<number>) => params.value ?? 0,
};

export const ratingDataYearBuiltCol: GridColDef = {
  ...yearBuiltCol,
  field: 'ratingPropertyData.yearBuilt',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.ratingPropertyData?.yearBuilt ?? null,
};

export const sqFootageCol: GridColDef = {
  field: 'sqFootage',
  headerName: 'Sq. Footage',
  type: 'number',
  minWidth: 140,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: (params: GridValueFormatterParams<number>) =>
    params.value ? numberFormat(params.value) : null,
  filterOperators: getGridFirestoreNumericOperators(),
};

export const ratingDataSqFootageCol: GridColDef = {
  ...sqFootageCol,
  field: 'ratingPropertyData.sqFootage',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.ratingPropertyData?.sqFootage ?? null,
};

export const numStoriesCol: GridColDef = {
  field: 'numStories',
  headerName: 'Num. Stories',
  type: 'number',
  minWidth: 100,
  flex: 0.4,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
};

export const ratingDataNumStoriesCol: GridColDef = {
  ...numStoriesCol,
  field: 'ratingPropertyData.numStories',
  valueGetter: (params) => params.row.ratingPropertyData?.numStories ?? null,
};

export const basementCol: GridColDef = {
  field: 'basement',
  headerName: 'Basement',
  minWidth: 120,
  flex: 0.8,
  // headerAlign: 'center',
  // align: 'right',
  filterOperators: getGridFirestoreStringOperators(),
};

export const ratingDataBasementCol: GridColDef = {
  ...basementCol,
  field: 'ratingPropertyData.basement',
  valueGetter: (params) => params.row.ratingPropertyData?.basement ?? null,
};

export const distToCoastFeetCol: GridColDef = {
  field: 'distToCoastFeet',
  headerName: 'Dist. to Coast (ft.)',
  type: 'number',
  minWidth: 160,
  flex: 0.8,
  headerAlign: 'center',
  align: 'right',
  valueFormatter: (params: GridValueFormatterParams<number>) =>
    params.value ? numberFormat(params.value) : null,
  filterOperators: getGridFirestoreNumericOperators(),
};

export const ratingDataDistToCoastFeetCol: GridColDef = {
  ...distToCoastFeetCol,
  field: 'ratingPropertyData.distToCoastFeet',
  valueGetter: (params) => params.row.ratingPropertyData?.distToCoastFeet ?? null,
};

export const CBRSCol: GridSingleSelectColDef = {
  field: 'CBRSDesignation',
  headerName: 'CBRS Des.',
  description: 'Coastal Barrier Reef System Designation provided by property api',
  type: 'singleSelect',
  valueOptions: CBRS_OPTIONS,
  minWidth: 100,
  flex: 0.5,
  // headerAlign: 'center',
  // align: 'right',
  filterOperators: getGridFirestoreSelectOperators(),
};

export const ratingDataCBRSCol: GridColDef = {
  ...CBRSCol,
  field: 'ratingPropertyData.CBRSDesignation',
  valueGetter: (params) => params.row.ratingPropertyData?.CBRSDesignation ?? null,
};

export const floodZoneCol: GridSingleSelectColDef = {
  field: 'floodZone',
  headerName: 'Flood Zone',
  type: 'singleSelect',
  valueOptions: FLOOD_ZONE_OPTIONS,
  minWidth: 100,
  flex: 0.8,
  // headerAlign: 'center',
  // align: 'right',
  filterOperators: getGridFirestoreSelectOperators(),
};

export const ratingDataFloodZoneCol: GridColDef = {
  ...floodZoneCol,
  field: 'ratingPropertyData.floodZone',
  valueGetter: (params) => params.row.ratingPropertyData?.floodZone ?? null,
};

export const priorLossCountCol: GridSingleSelectColDef = {
  field: 'priorLossCount',
  headerName: 'Prior Losses',
  description: 'Prior loss count provided by user',
  type: 'singleSelect',
  valueOptions: PRIOR_LOSS_COUNT_OPTIONS,
  minWidth: 100,
  flex: 0.4,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreSelectOperators(),
  // TODO: valueFormatter
};

export const ratingDataPriorLossCountCol: GridColDef = {
  ...priorLossCountCol,
  field: 'ratingPropertyData.priorLossCount',
  valueGetter: (params) => params.row.ratingPropertyData?.priorLossCount ?? null,
};

export const rcvSourceUserCol: GridColDef = {
  field: 'rcvSourceUser',
  headerName: 'RCV Source User',
  type: 'boolean',
  minWidth: 120,
  flex: 0.4,
  headerAlign: 'center',
  align: 'center',
  filterOperators: getGridFirestoreBooleanOperators(),
};

export const userIdCol: GridColDef = {
  field: 'userId',
  headerName: 'User ID',
  filterOperators: getGridFirestoreStringOperators(),
  valueGetter: (params) => params.value || null,
  ...copyBaseProps,
};

export const agentNameCol: GridColDef = {
  field: 'agentName',
  headerName: 'Agent Name',
  minWidth: 180,
  flex: 0.8,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
};

export const nestedAgentNameCol: GridColDef = {
  ...agentNameCol,
  field: 'agent.name',
  filterOperators: getGridFirestoreStringOperators(),
  valueGetter: (params: GridValueGetterParams<any, any>) => params.row.agent?.name || null,
};

export const agentEmailCol: GridColDef = {
  ...emailCol,
  field: 'agent.email',
  headerName: 'Agent Email',
  filterOperators: getGridFirestoreStringOperators(),
  valueGetter: (params) => params.row.agent?.email || null,
};

export const agentPhoneCol: GridColDef = {
  ...phoneCol,
  field: 'agent.phone',
  headerName: 'Agent Phone',
  filterOperators: getGridFirestoreStringOperators(),
  valueGetter: (params) => params.row.agent?.phone || null,
};

export const agentIdCol: GridColDef = {
  field: 'agentId',
  headerName: 'Agent ID',
  filterOperators: getGridFirestoreStringOperators(),
  ...copyBaseProps,
};

export const nestedAgentUserIdCol: GridColDef = {
  ...agentIdCol,
  field: 'agent.userId',
  valueGetter: (params: GridValueGetterParams) => params.row.agent?.userId || null,
};

export const agencyIdCol: GridColDef = {
  field: 'agencyId',
  headerName: 'Agency ID',
  filterOperators: getGridFirestoreStringOperators(),
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
  type: 'number',
  minWidth: 150,
  flex: 0.8,
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.AAL?.inland ?? null,
  renderCell: (params) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const surgeAALCol: GridColDef = {
  field: 'AAL.surge',
  headerName: 'Surge AAL',
  description: 'Surge Peril Average Annual Loss from Swiss Re',
  type: 'number',
  minWidth: 150,
  flex: 0.8,
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.AAL?.surge ?? null,
  renderCell: (params) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const tsunamiAALCol: GridColDef = {
  field: 'AAL.tsunami',
  headerName: 'Tsunami AAL',
  description: 'Tsunami Peril Average Annual Loss from Swiss Re',
  type: 'number',
  minWidth: 150,
  flex: 0.8,
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.AAL?.tsunami ?? null,
  renderCell: (params) => <GridCellCopy value={params.value} />,
};

export const annualPremiumCol: GridColDef = {
  field: 'annualPremium',
  headerName: 'Annual Premium',
  description: 'Annual premium before taxes and fees',
  type: 'number',
  minWidth: 140,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueFormatter: formatGridCurrency,
};

export const termPremiumCol: GridColDef = {
  field: 'termPremium',
  headerName: 'Term Premium',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
  valueFormatter: (params) => formatGridCurrency(params, '$0,0.00'),
};

export const termDaysCol: GridColDef = {
  field: 'termDays',
  headerName: 'Term Days',
  type: 'number',
  minWidth: 100,
  flex: 0.5,
  editable: false,
  headerAlign: 'center',
  align: 'right',
  filterOperators: getGridFirestoreNumericOperators(),
};

export const locationsCount: GridColDef = {
  field: 'locationsCount',
  headerName: '# locations',
  type: 'number',
  minWidth: 100,
  flex: 0.5,
  editable: false,
  filterable: false,
  sortable: false,
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
  filterable: false,
  sortable: false,
  // disableExport: true,
  valueFormatter: ({ value }) => {
    if (Array.isArray(value))
      return value.map((addr) => formatAddrSummary(addr, true)).join('  |  ');

    return value || '';
  },
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

export const locationIdCol: GridColDef = {
  ...idCol,
  field: 'locationId',
  headerName: 'Location ID',
};

export const policyIdCol: GridColDef = {
  ...idCol,
  field: 'policyId',
  headerName: 'Policy ID',
};

export const homeStateCol: GridSingleSelectColDef = {
  field: 'homeState',
  headerName: 'Home State',
  type: 'singleSelect',
  valueOptions: STATES_ABV_ARR,
  minWidth: 100,
  flex: 0.4,
  editable: false,
  filterOperators: getGridFirestoreSelectOperators(),
};

export const productCol: GridSingleSelectColDef = {
  field: 'product',
  headerName: 'Product',
  minWidth: 100,
  flex: 0.4,
  editable: false,
  type: 'singleSelect',
  valueOptions: PRODUCT_OPTIONS,
  filterOperators: getGridFirestoreSelectOperators(),
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

// TODO: multi-select type
export const productsCol: GridSingleSelectColDef = {
  // ...GRID_MULTI_SELECT_COL_DEF,
  ...multiSelectExtendsSingle,
  field: 'products',
  headerName: 'Products', // @ts-ignore
  valueOptions: PRODUCT_OPTIONS,
  type: 'singleSelect',
  minWidth: 180,
  flex: 1,
  editable: false,
  valueFormatter: (params) => `${params.value?.join(', ')}`,
  // filterable: false, // TODO: implement array-contains search (multiselectoperators)
  // filterOperators: getGridFirestoreMultiSelectOperators(),
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
  filterOperators: getGridFirestoreStringOperators(),
  valueGetter: (params) => params.row.surplusLinesProducerOfRecord?.name || null,
};

export const SLProducerOfRecordLicenseNum: GridColDef = {
  ...copyBaseProps,
  field: 'SLProducerOfRecord.licenseNum',
  headerName: 'SL PofR License',
  description: 'Surplus Lines Producer of Record license number',
  filterOperators: getGridFirestoreStringOperators(),
  valueGetter: (params) => params.row.surplusLinesProducerOfRecord?.licenseNum || null,
};

export const SLProducerOfRecordLicenseState: GridColDef = {
  field: 'SLProducerOfRecord.licenseState',
  headerName: 'SL PofR License State',
  description: 'Surplus Lines Producer of Record license state',
  valueOptions: STATES_ABV_ARR,
  filterOperators: getGridFirestoreSelectOperators(),
  valueGetter: (params) => params.row.surplusLinesProducerOfRecord?.licenseState || null,
};

export const SLProducerOfRecordLicensePhone: GridColDef = {
  ...phoneCol,
  field: 'SLProducerOfRecord.phone',
  headerName: 'SL PofR License Phone',
  description: 'Surplus Lines Producer of Record license provided phone number',
  filterOperators: getGridFirestoreStringOperators(),
  valueGetter: (params) => params.row.surplusLinesProducerOfRecord?.phone || null,
};

export const SLProducerOfRecordLicenseAddress: GridColDef = {
  ...addressSummaryCol,
  field: 'SLProducerOfRecord.address',
  headerName: 'SL PofR License Address',
  description: 'Surplus Lines Producer of Record license provided address',
  filterable: false,
  sortable: false,
  valueGetter: (params) => formatAddrSummary(params.row.surplusLinesProducerOfRecord?.address),
};

export const issuingCarrierCol: GridColDef = {
  field: 'issuingCarrier',
  headerName: 'Carrier',
  minWidth: 180,
  flex: 0.6,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
};

export const additionalInsuredsCol: GridColDef = {
  field: 'additionalInsureds',
  headerName: 'Additional Insureds',
  minWidth: 260,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  disableExport: true,
  valueGetter: (params) =>
    params.row.additionalInsureds?.map((ai: AdditionalInsured) => ai.name) || null,
  valueFormatter: ({ value }) => {
    if (Array.isArray(value) && value.length)
      return value.map((ai: AdditionalInsured) => `${ai.name} (${ai.email})`).join('  |  ');
    return value;
  },
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
  filterable: false,
  sortable: false,
  // disableExport: true,
  valueGetter: (params) => params.row.mortgageeInterest?.map((m: Mortgagee) => m.name) || null,
  valueFormatter: ({ value }) => {
    if (Array.isArray(value) && value.length)
      return value
        .map((m: Mortgagee) => `${m.name} (${m.contactName} - ${m.contactEmail})`)
        .join('  |  ');
    return value;
  },
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
  type: 'string',
  field: 'externalId',
  headerName: 'External ID',
  filterOperators: getGridFirestoreStringOperators(),
};

export const ratingDocIdCol: GridColDef = {
  ...idCol,
  field: 'ratingDocId',
  headerName: 'Rating Doc ID',
  filterOperators: getGridFirestoreStringOperators(),
};

// TODO: make multi-select
export const subjectBaseCol: GridColDef = {
  // ...multiSelectExtendsSingle,
  field: 'subjectBase',
  headerName: 'Subject Base',
  minWidth: 340,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  renderCell: renderChips,
};

export const policyTrxTypesCol: GridSingleSelectColDef = {
  ...multiSelectExtendsSingle,
  field: 'transactionTypes',
  headerName: 'Transaction Types',
  type: 'singleSelect',
  valueOptions: TRANSACTION_OPTIONS,
  minWidth: 340,
  flex: 1,
  editable: false,
  // filterable: false,
  sortable: false,
  renderCell: (params) => renderChips(params, { variant: 'outlined', color: 'success' }),
  valueFormatter: (params) => `${params.value?.join(', ')}`,
};

export const trxTypeCol: GridSingleSelectColDef = {
  field: 'trxType',
  headerName: 'Type',
  description: 'Type of transaction (endorsement, amendment, cancellation, etc.)',
  type: 'singleSelect',
  valueOptions: TRANSACTION_OPTIONS,
  minWidth: 160,
  flex: 1,
  editable: false,
  sortable: false,
  renderCell: renderChip,
};

export const requestEffDateCol: GridColDef = {
  ...effectiveDateCol,
  field: 'requestEffDate',
  headerName: 'Eff. Date',
  description: 'Requested effective date for changes',
  valueGetter: (params) => params.row.requestEffDate || null,
};

export const LOBCol: GridSingleSelectColDef = {
  ...multiSelectExtendsSingle,
  field: 'LOB',
  headerName: 'LOB',
  type: 'singleSelect',
  valueOptions: LOB_OPTIONS,
  minWidth: 200,
  flex: 0.6,
  editable: false,
  // filterable: false,
  sortable: false,
  renderCell: (params) => renderChips(params, { variant: 'outlined' }),
  valueFormatter: (params) => `${params.value?.join(', ')}`,
};

export const importCollectionCol: GridColDef = {
  field: 'importCollection',
  headerName: 'Collection',
  description: 'target database collection for import',
  minWidth: 160,
  flex: 0.8,
  filterOperators: getGridFirestoreStringOperators(),
};

export const importDocIdsCol: GridColDef = {
  field: 'importDocIds',
  headerName: 'Doc IDs',
  description: 'IDs of the records created from the import',
  minWidth: 200,
  flex: 1,
  // filterOperators: getGridFirestoreStringOperators(),
  filterable: false,
  sortable: false,
  // TODO: set array filters
  renderCell: (params) => renderChips(params, { variant: 'outlined', color: 'success' }),
};

export const importDocIdsCountCol: GridColDef = {
  field: 'importDocIdsCount',
  headerName: 'Import Count',
  description: 'Count of successfully created records',
  type: 'number',
  minWidth: 120,
  flex: 1,
  filterable: false,
  sortable: false,
  valueGetter: (params) => (params.row.importDocIds ? params.row.importDocIds.length : null),
};

// export const importCreationErrorsCol: GridColDef = {
//   field: 'docCreationErrors',
//   headerName: 'Doc Create Errors',
//   description: 'Errors which occurred when attempting to create the record in the database',
//   minWidth: 200,
//   flex: 1,
//   filterable: false,
// };

export const importCreationErrorsCountCol: GridColDef = {
  field: 'docCreationErrorsCount',
  headerName: 'Doc Create Errors Count',
  description: 'Errors which occurred when attempting to create the record in the database',
  type: 'number',
  headerAlign: 'center',
  align: 'right',
  minWidth: 140,
  flex: 1,
  filterable: false,
  sortable: false,
  valueGetter: (params) => (params.row.docCreateErrors ? params.row.docCreateErrors.length : null),
};

export const invalidRowsCol: GridColDef = {
  field: 'invalidRows',
  headerName: 'Invalid Rows',
  description: 'Count of rows that failed validation and were NOT imported',
  type: 'number',
  minWidth: 100,
  flex: 1,
  // filterOperators: getGridFirestoreStringOperators(),
  editable: false,
  filterable: false,
  sortable: false,
  // TODO: set array filters
};

function getEventChipProps(val: string | undefined): Partial<ChipProps> {
  if (!val) return {};
  switch (val) {
    case 'delivered':
      return { color: 'success', icon: <CheckRounded /> };
    case 'processed':
      return { color: 'info', icon: <EmailRounded /> };
    case 'bounce':
      return { color: 'error', icon: <CancelScheduleSendRounded /> };
    case 'deferred':
      return { color: 'warning', icon: <CancelRounded /> };
    case 'dropped':
      return { color: 'warning', icon: <ErrorOutlineRounded /> };
    default:
      return { color: 'default', icon: <EmailRounded /> };
  }
} // processed, dropped, delivered, deferred, bounce

export const sendgridEventCol: GridColDef = {
  field: 'event',
  headerName: 'Event',
  minWidth: 140,
  flex: 0.6,
  valueGetter: (params) => params.row.event || null,
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    if (!params.value || typeof params.value !== 'string') return null;
    return (
      <Chip
        label={params.value}
        size='small'
        variant='outlined'
        {...getEventChipProps(params.value)}
      />
    );
  },
};
export const sendgridMsgIdCol: GridColDef = {
  ...idCol,
  field: 'sg_message_id',
  headerName: 'SG Msg ID',
  description: 'sendgrid message ID',
};

export const ipCol: GridColDef = {
  field: 'ip',
  headerName: 'IP',
  minWidth: 140,
  flex: 0.4,
  editable: false,
};

// TODO: make select ??
export const emailTypeCol: GridColDef = {
  field: 'eventType',
  headerName: 'Type',
  type: 'string',
  editable: false,
  renderCell: (params) => renderSplitSnakeCase(params),
  filterOperators: getGridFirestoreStringOperators(),
};
