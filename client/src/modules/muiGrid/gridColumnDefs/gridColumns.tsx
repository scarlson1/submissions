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
  HistoryEduRounded,
  HourglassBottomRounded,
  HourglassEmptyRounded,
  HourglassTopRounded,
  OpenInNewRounded,
  PendingRounded,
  PlaceRounded,
  QueryBuilderRounded,
  RequestQuoteRounded,
  StormRounded,
  ThumbDownRounded,
} from '@mui/icons-material';
import { Box, Chip, ChipProps, Typography } from '@mui/material';
import {
  GridAlignment,
  GridCellParams,
  GridColDef,
  GridRenderCellParams,
  GridSingleSelectColDef,
  GridTreeNode,
  GridValueFormatterParams,
  GridValueGetterParams,
  ValueOptions,
} from '@mui/x-data-grid';
import { GeoPoint, Timestamp } from 'firebase/firestore';
import { isDate } from 'lodash';
import { toast } from 'react-hot-toast';

import {
  AGENCY_SUBMISSION_STATUS,
  AdditionalInsured,
  Address,
  CHANGE_REQUEST_STATUS,
  INVITE_STATUS,
  Mortgagee,
  Nullable,
  POLICY_STATUS,
  PRODUCT,
  PolicyLocation,
  QUOTE_STATUS,
  SUBMISSION_STATUS,
} from 'common';
import { FileLink, GridCellCopy, renderGridEmail, renderGridPhone } from 'components';
import {
  renderCellExpand,
  renderChip,
  renderChips,
  renderCurrency,
  renderJoinArray,
  renderNumber,
  renderPercent,
  renderSplitSnakeCase,
} from 'components/RenderGridCellHelpers';
import { CANCEL_REASON_OPTIONS } from 'elements/forms/CancelForm';
import { TRANSACTION_OPTIONS } from 'elements/forms/TaxForm';
import { multiSelectExtendsSingle } from 'modules/muiGrid/gridMultiSelectColDef';
import {
  getGridFirestoreBooleanOperators,
  getGridFirestoreDateOperators,
  getGridFirestoreNumericOperators,
  getGridFirestoreSelectOperators,
  getGridFirestoreStringOperators,
} from 'modules/muiGrid/operators';
import {
  calcSum,
  formatFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
  getGridAddressComponent,
  isCurrentDateBetween,
  numberFormat,
  popUpWasBlocked,
} from 'modules/utils';
import {
  CBRS_OPTIONS,
  CONSTRUCTION_TYPE,
  FLOOD_ZONE_OPTIONS,
  LOB_OPTIONS,
  PRIOR_LOSS_COUNT_OPTIONS,
  PRODUCT_OPTIONS,
} from '../../../common/constants';
import { STATES_ABV_ARR } from '../../../common/statesList';

export const copyBaseProps: Partial<GridColDef> = {
  flex: 1.2,
  minWidth: 200,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => {
    if (!params.value) return null;
    return <GridCellCopy value={params.value} />;
  },
};

export const numericColBaseProps: Partial<GridColDef> = {
  type: 'number',
  align: 'right',
  headerAlign: 'center',
  filterOperators: getGridFirestoreNumericOperators(),
  renderCell: renderNumber,
};

export const percentColBaseProps: Partial<GridColDef> = {
  ...numericColBaseProps,
  minWidth: 120,
  flex: 0.8,
  renderCell: renderPercent,
};

export const dateColBaseProps: Partial<GridColDef> = {
  type: 'date',
  minWidth: 180,
  flex: 1,
  valueFormatter: formatGridFirestoreTimestampAsDate,
  filterOperators: getGridFirestoreDateOperators(),
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

const addressSummaryBase: GridColDef = {
  field: 'address',
  headerName: 'Address',
  minWidth: 280,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  renderCell: renderCellExpand,
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
};

export const agencyAddressCol: GridColDef = {
  ...addressSummaryCol,
  field: 'agency.address',
  headerName: 'Agency Address',
  filterable: false,
  sortable: false,
  valueGetter: (params) => formatAddrSummary(params.row.agency?.address),
};

export const mailingAddressCol: GridColDef = {
  ...addressSummaryCol,
  field: 'mailingAddress',
  headerName: 'Mailing Address',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    formatAddrSummary(params.row.mailingAddress),
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

export const errMsgCol: GridColDef = {
  field: 'errMsg',
  headerName: 'Error',
  minWidth: 200,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  filterOperators: getGridFirestoreStringOperators(),
  valueGetter: (params) => params.row.error || null,
  renderCell: renderCellExpand,
};

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
  filterOperators: getGridFirestoreBooleanOperators(),
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
  valueSetter: (params) => {
    const effDateTS =
      params.value && isDate(params.value)
        ? Timestamp.fromDate(params.value)
        : params.value || null;
    return { ...params.row, effectiveDate: effDateTS };
  },
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
  valueSetter: (params) => {
    const effDateTS = params.value ? Timestamp.fromDate(params.value) : null;
    return { ...params.row, expirationDate: effDateTS };
  },
  valueFormatter: formatGridFirestoreTimestampAsDate,
  filterOperators: getGridFirestoreDateOperators(),
};

export const currencyCol: Partial<GridColDef> = {
  ...numericColBaseProps,
  minWidth: 120,
  flex: 0.8,
  renderCell: renderCurrency,
};

export const limitACol: GridColDef = {
  ...currencyCol,
  field: 'limits.limitA',
  headerName: 'Building Limit',
  description: 'Coverage A limit (building)',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  valueGetter: (params) => params.row.limits?.limitA ?? null,
  renderCell: (params) => renderCurrency(params, false, { fontWeight: 'medium' }),
};

export const limitBCol: GridColDef = {
  ...currencyCol,
  field: 'limits.limitB',
  headerName: 'Other Structures Limit',
  description: 'Coverage B limit (appurtenant structures)',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  valueGetter: (params) => params.row.limits?.limitB ?? null,
  renderCell: (params) => renderCurrency(params, false, { fontWeight: 'medium' }),
};

export const limitCCol: GridColDef = {
  ...currencyCol,
  field: 'limits.limitC',
  headerName: 'Contents Limit',
  description: 'Coverage C limit (contents)',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  valueGetter: (params) => params.row.limits?.limitC ?? null,
  renderCell: (params) => renderCurrency(params, false, { fontWeight: 'medium' }),
};

export const limitDCol: GridColDef = {
  ...currencyCol,
  field: 'limits.limitD',
  headerName: 'BI Limit',
  description: 'Coverage D limit (living expenses / business interruption)',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  valueGetter: (params) => params.row.limits?.limitD ?? null,
  renderCell: (params) => renderCurrency(params, false, { fontWeight: 'medium' }),
};

export const tivCol: GridColDef = {
  ...currencyCol,
  field: 'TIV',
  headerName: 'TIV',
  description: 'Total Insured Value (sum of coverage limits)',
  type: 'number',
  minWidth: 120,
  flex: 0.8,
  editable: false,
  filterable: false, // could be calculated value
  sortable: false,
  valueGetter: (params) => {
    if (params.row.TIV) return params.row.TIV;
    if (params.row.limits?.TIV) return params.row.limits.TIV;

    const limits = params.row.limits;
    if (!limits) return null;
    try {
      const tiv = calcSum(Object.values(limits));
      return tiv;
    } catch (err) {
      return null;
    }
  },
  renderCell: (params) => renderCurrency(params, false, { fontWeight: 'medium' }),
};

export const deductibleCol: GridColDef = {
  ...currencyCol,
  field: 'deductible',
  headerName: 'Deductible',
  type: 'number',
  minWidth: 100,
  flex: 0.5,
  editable: false,
  renderCell: (params) => renderCurrency(params, false, { fontWeight: 'medium' }),
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
  ...currencyCol,
  field: 'replacementCost',
  headerName: 'Replacement Cost',
  description: 'Building replacement cost',
  type: 'number',
  minWidth: 140,
  flex: 0.8,
  renderCell: (params) => renderCurrency(params, false),
};

export const ratingDataReplacementCostCol: GridColDef = {
  ...replacementCostCol,
  field: 'ratingPropertyData.replacementCost',
  valueGetter: (params) => params.row.ratingPropertyData?.replacementCost ?? null,
};

export const subproducerCommissionCol: GridColDef = {
  ...percentColBaseProps,
  field: 'subproducerCommission',
  headerName: 'Commission',
  minWidth: 120,
  flex: 0.8,
  editable: false,
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
  valueFormatter: (params: GridValueFormatterParams<number>) => params.value ?? null,
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

export const unitsCol: GridColDef = {
  ...numericColBaseProps,
  field: 'units',
  headerName: 'Units',
};

export const ratingDataUnitsCol: GridColDef = {
  ...unitsCol,
  field: 'ratingPropertyData.units',
  valueGetter: (params) => params.row.ratingPropertyData?.units ?? null,
};

export const tier1Col: GridColDef = {
  field: 'tier1',
  headerName: 'Tier 1',
  type: 'boolean',
  filterOperators: getGridFirestoreBooleanOperators(),
};

export const ratingDataTier1Col: GridColDef = {
  ...tier1Col,
  field: 'ratingPropertyData.tier1',
  valueGetter: (params) => params.row.ratingPropertyData?.tier1 ?? null,
};

// TODO: make construction type: 'singleSelect'
export const constructionCol: GridColDef = {
  field: 'construction',
  headerName: 'Construction',
  type: 'singleSelect',
  minWidth: 120,
  flex: 0.4,
  valueOptions: CONSTRUCTION_TYPE,
};

export const ratingDataConstructionCol: GridColDef = {
  ...constructionCol,
  field: 'ratingPropertyData.construction',
  valueGetter: (params) => params.row.ratingPropertyData?.construction ?? null,
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
  field: 'AALs.inland',
  headerName: 'Inland AALs',
  description: 'Inland Peril Average Annual Loss from Swiss Re',
  type: 'number',
  minWidth: 150,
  flex: 0.8,
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.AALs?.inland ?? null,
  renderCell: (params) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const surgeAALCol: GridColDef = {
  field: 'AALs.surge',
  headerName: 'Surge AALs',
  description: 'Surge Peril Average Annual Loss from Swiss Re',
  type: 'number',
  minWidth: 150,
  flex: 0.8,
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.AALs?.surge ?? null,
  renderCell: (params) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const tsunamiAALCol: GridColDef = {
  field: 'AALs.tsunami',
  headerName: 'Tsunami AALs',
  description: 'Tsunami Peril Average Annual Loss from Swiss Re',
  type: 'number',
  minWidth: 150,
  flex: 0.8,
  filterOperators: getGridFirestoreNumericOperators(),
  valueGetter: (params) => params.row.AALs?.tsunami ?? null,
  renderCell: (params) => <GridCellCopy value={params.value} />,
};

export const annualPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'annualPremium',
  headerName: 'Annual Premium',
  description: 'Annual premium before taxes and fees',
  type: 'number',
  minWidth: 140,
  flex: 0.8,
  editable: false,
};

export const termPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'termPremium',
  headerName: 'Term Premium',
  minWidth: 120,
  flex: 0.8,
  editable: false,
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
  renderCell: (params) =>
    renderChip(params, { variant: 'outlined', size: 'small' }, ({ value }: any) =>
      getProductChipProps(value)
    ),
};

function getProductChipProps(value: string): Partial<ChipProps> {
  switch (value) {
    case PRODUCT.FLOOD:
      return { icon: <FloodRounded />, color: 'primary' };
    case PRODUCT.WIND:
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
  // filterable: false, // TODO: implement array-contains search (multi-select operators)
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
  minWidth: 260,
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
  minWidth: 120,
  flex: 1,
  editable: false,
  filterOperators: getGridFirestoreStringOperators(),
  renderCell: renderChip,
};

export const requestEffDateCol: GridColDef = {
  ...effectiveDateCol,
  field: 'requestEffDate',
  headerName: 'Eff. Date',
  description: 'Requested effective date for changes',
  editable: true,
  valueGetter: (params) => params.row.requestEffDate || null,
  valueSetter: (params) => {
    const effDateTS =
      params.value && isDate(params.value)
        ? Timestamp.fromDate(params.value)
        : params.value || null;
    return { ...params.row, requestEffDate: effDateTS };
  },
  // renderCell: ({ value }) => {
  //   if (!value) return null;
  //   const formattedVal = formatDate(value);

  //   return <Typography variant='body2'>{formattedVal}</Typography>;
  // },
  // valueGetter: (params) => {
  //   if (!params.row.requestEffDate) return null;

  //   return params.row.requestEffDate.toDate();
  // },
  // valueSetter: (params) => {
  //   // console.log('VALUE SETTER PARAMS: ', params);
  //   if (!params.value) return null;
  //   if (isDate(params.value)) return Timestamp.fromDate(params.value);
  //   return params.value;
  // },
};

export const scopeCol: GridSingleSelectColDef = {
  field: 'scope',
  headerName: 'Scope',
  description: 'changes affecting a single location or a policy level field',
  type: 'singleSelect',
  valueOptions: ['location', 'policy'],
  minWidth: 140,
  flex: 1,
  renderCell: (params) =>
    renderChip(params, { variant: 'outlined' }, () => {
      if (params.value === 'location')
        return { color: 'info', size: 'small', icon: <PlaceRounded fontSize='inherit' /> };
      if (params.value === 'policy')
        return { color: 'success', size: 'small', icon: <HistoryEduRounded fontSize='inherit' /> };
      return {};
    }),
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

export const dailyPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'dailyPremium',
  headerName: 'Daily Premium',
  editable: false,
};

export const cancelEffDateCol: GridColDef = {
  ...effectiveDateCol,
  field: 'cancelEffDate',
  headerName: 'Cancel Eff. Date',
  valueGetter: (params) => params.row.cancelEffDate || null,
};

export const minPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'minPremiumCol',
  headerName: 'Min. Premium',
  width: 140,
  flex: 0.5,
  editable: false,
  renderCell: (params) => renderCurrency(params, true),
};

export const techInlandPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'techPremium.inland',
  headerName: 'Inland Tech. Premium',
  minWidth: 140,
  flex: 0.5,
  editable: false,
  valueGetter: ({ row }) => row.techPremium?.inland ?? null,
};

export const techSurgePremiumCol: GridColDef = {
  ...currencyCol,
  field: 'techPremium.surge',
  headerName: 'Surge Tech. Premium',
  minWidth: 140,
  flex: 0.5,
  editable: false,
  valueGetter: ({ row }) => row.techPremium?.surge ?? null,
};

export const techTsunamiPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'techPremium.tsunami',
  headerName: 'Tsunami Tech. Premium',
  minWidth: 140,
  flex: 0.5,
  editable: false,
  valueGetter: ({ row }) => row.techPremium?.tsunami ?? null,
};

export const inlandCategoryPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'floodCategoryPremium.inland',
  headerName: 'Inland Category Premium',
  minWidth: 140,
  flex: 0.5,
  editable: false,
  valueGetter: ({ row }) => row.floodCategoryPremium?.inland ?? null,
};

export const surgeCategoryPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'floodCategoryPremium.surge',
  headerName: 'Surge Category Premium',
  minWidth: 140,
  flex: 0.5,
  editable: false,
  valueGetter: ({ row }) => row.floodCategoryPremium?.surge ?? null,
};

export const tsunamiCategoryPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'floodCategoryPremium.tsunami',
  headerName: 'Tsunami Category Premium',
  minWidth: 140,
  flex: 0.5,
  editable: false,
  valueGetter: ({ row }) => row.floodCategoryPremium?.tsunami ?? null,
};

export const premiumSubtotalCol: GridColDef = {
  ...currencyCol,
  field: 'premiumSubtotal',
  headerName: 'Premium Subtotal',
  minWidth: 140,
  flex: 0.5,
  editable: false,
  valueGetter: ({ row }) => row.premiumSubtotal ?? null,
};

export const provisionalPremiumCol: GridColDef = {
  ...currencyCol,
  field: 'provisionalPremium',
  headerName: 'Provisional Premium',
  minWidth: 140,
  flex: 0.5,
  editable: false,
  valueGetter: ({ row }) => row.provisionalPremium ?? null,
};

export const subproducerAdjCol: GridColDef = {
  ...currencyCol,
  field: 'subproducerAdj',
  headerName: 'Subproducer Adj.',
  minWidth: 140,
  flex: 0.5,
  editable: false,
  valueGetter: ({ row }) => row.subproducerAdj ?? null,
};

export const dwpCol: GridColDef = {
  ...annualPremiumCol,
  field: 'directWrittenPremium',
  headerName: 'DWP',
  valueGetter: ({ row }) => row.directWrittenPremium ?? null,
};

export const termCol: GridColDef = {
  ...numericColBaseProps,
  field: 'term',
  headerName: 'Term',
  minWidth: 64,
  flex: 0.2,
};

export const bookingDateCol: GridColDef = {
  ...dateColBaseProps,
  field: 'bookingDate',
  headerName: 'Booking Date',
  description: 'later of transaction timestamp or transaction effective date',
};

export const namedInsuredTrxCol: GridColDef = {
  field: 'namedInsured',
  headerName: 'Named Insured',
  editable: false,
  minWidth: 180,
  flex: 0.6,
  filterOperators: getGridFirestoreStringOperators(),
};

export const eventId: GridColDef = {
  ...idCol,
  field: 'eventId',
  headerName: 'Event Id',
  filterable: false,
  sortable: false,
  editable: false,
};

export const trxMGACommissionCol: GridColDef = {
  ...currencyCol,
  field: 'MGACommission',
  headerName: 'MGA Commission',
  editable: false,
};

export const trxMGACommissionPctCol: GridColDef = {
  ...subproducerCommissionCol,
  field: 'MGACommissionPct',
  headerName: 'MGA Comm. Pct',
  editable: false,
};

export const netDWPCol: GridColDef = {
  ...currencyCol,
  field: 'netDWP',
  headerName: 'Net DWP',
  description: 'term premium - MGA commission',
  editable: false,
};

export const termProratedPctCol: GridColDef = {
  ...percentColBaseProps,
  field: 'termProratedPct',
  headerName: 'Term Prorated Pct.',
  editable: false,
};

export const netErrAdjCol: GridColDef = {
  ...currencyCol,
  field: 'netErrorAdj',
  headerName: 'Net Error Adj.',
  editable: false,
};

export const trxOtherInterestedPartiesCol: GridColDef = {
  field: 'otherInterestedParties',
  headerName: 'Other Interested Parties',
  minWidth: 200,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  valueGetter: (params) => params.row.otherInterestedParties || null,
  renderCell: renderJoinArray,
  valueFormatter: (params) => {
    if (!params.value || !Array.isArray(params.value)) return null;
    return params.value.join('');
  },
};

export const trxAdditionalNamedInsuredCol: GridColDef = {
  field: 'additionalNamedInsured',
  headerName: 'Additional Named Insured',
  minWidth: 200,
  flex: 1,
  editable: false,
  filterable: false,
  sortable: false,
  valueGetter: (params) => params.row.otherInterestedParties || null,
  renderCell: renderJoinArray,
  valueFormatter: (params) => {
    if (!params.value || !Array.isArray(params.value)) return null;
    return params.value.join('');
  },
};

export const cancelReasonCol: GridSingleSelectColDef = {
  field: 'cancelReason',
  headerName: 'Cancel Reason',
  type: 'singleSelect',
  description: 'user selected reason for cancellation request (applicable to cancellation trx)',
  minWidth: 160,
  flex: 1,
  editable: false,
  valueOptions: CANCEL_REASON_OPTIONS,
  getOptionValue: (value: ValueOptions) => {
    const t = typeof value;
    if (t === 'string' || t === 'number') return t;
    // @ts-ignore
    if (t === 'object' && value.hasOwnProperty('value')) return value.value;

    return t;
  }, // @ts-ignore
  getOptionLabel: (value: ValueOptions) => value.label,
  filterOperators: getGridFirestoreSelectOperators(),
  valueFormatter: (params) => params.value,
};

export const trxTimestamp: GridColDef = {
  ...dateColBaseProps,
  type: 'datetime',
  field: 'trxDatetime',
  headerName: 'Trx Timestamp',
  editable: false,
  valueGetter: (params) => params.row.metadata?.created,
};

export const trxLocationAddressSummaryCol: GridColDef = {
  ...addressSummaryCol,
  field: 'insuredLocation.address',
  headerName: 'Insured Address',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    formatAddrSummary(params.row.insuredLocation?.address, true),
  sortable: false,
  filterable: false,
  editable: false,
};

export const trxLocationAddressLine1Col: GridColDef = {
  ...address1Col,
  field: 'insuredLocation.address.addressLine1',
  headerName: 'Insured Location Address 1',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.insuredLocation?.address?.addressLine1 || null,
};

export const trxLocationAddressLine2Col: GridColDef = {
  ...address2Col,
  field: 'insuredLocation.address.addressLine2',
  headerName: 'Insured Location Address 2',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.insuredLocation?.address?.addressLine2 || null,
};

export const trxLocationCityCol: GridColDef = {
  ...cityCol,
  field: 'insuredLocation.address.city',
  headerName: 'Insured Location City',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.insuredLocation?.address?.city || null,
};

export const trxLocationStateCol: GridColDef = {
  ...stateCol,
  field: 'insuredLocation.address.state',
  headerName: 'Insured Location State',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.insuredLocation?.address?.state || null,
};

export const trxLocationPostalCol: GridColDef = {
  ...postalCol,
  field: 'insuredLocation.address.postal',
  headerName: 'Insured Location Postal',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.insuredLocation?.address?.postal || null,
};

export const trxLocationCountyCol: GridColDef = {
  ...countyCol,
  field: 'insuredLocation.address.countyName',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.insuredLocation?.address?.countyName || null,
};

export const trxLocationFIPSCol: GridColDef = {
  ...fipsCol,
  field: 'insuredLocation.address.countyFIPS',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.insuredLocation?.address?.countyFIPS || null,
};

export const trxLatitudeCol: GridColDef = {
  ...latitudeCol,
  field: 'insuredLocation.coordinates.latitude',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.insuredLocation?.coordinates?.latitude || null,
};

export const trxLongitudeCol: GridColDef = {
  ...longitudeCol,
  field: 'insuredLocation.coordinates.longitude',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.insuredLocation?.coordinates?.longitude || null,
};

export const trxCoordinatesCol: GridColDef = {
  ...coordinatesCol,
  field: 'insuredLocation.coordinates',
  valueGetter: (params) => params.row.insuredLocation?.coordinates || null,
};

export const mailingAddress1Col: GridColDef = {
  ...address1Col,
  field: 'mailingAddress.addressLine1',
  headerName: 'Mailing Address 1',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.mailingAddress?.addressLine1 || null,
};

export const mailingAddress2Col: GridColDef = {
  ...address2Col,
  field: 'mailingAddress.addressLine2',
  headerName: 'Mailing Address 2',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.mailingAddress?.addressLine2 || null,
};

export const mailingCityCol: GridColDef = {
  ...cityCol,
  field: 'mailingAddress.city',
  headerName: 'Mailing City',
  valueGetter: (params: GridValueGetterParams<any, any>) => params.row.mailingAddress?.city || null,
};

export const mailingStateCol: GridColDef = {
  ...stateCol,
  field: 'mailingAddress.state',
  headerName: 'Mailing State',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.mailingAddress?.state || null,
};

export const mailingPostalCol: GridColDef = {
  ...postalCol,
  field: 'mailingAddress.postal',
  headerName: 'Mailing Postal',
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    params.row.mailingAddress?.postal || null,
};

export const buildingRCVCol: GridColDef = {
  ...currencyCol,
  field: 'RCVs.building',
  headerName: 'Building RCV',
  valueGetter: (params) => params.row.RCVs?.building || null,
  renderCell: (params) => renderCurrency(params, false),
};

export const otherStructuresRCVCol: GridColDef = {
  ...currencyCol,
  field: 'RCVs.otherStructures',
  headerName: 'Other Structures RCV',
  valueGetter: (params) => params.row.RCVs?.otherStructures || null,
  renderCell: (params) => renderCurrency(params, false),
};

export const contentsRCVCol: GridColDef = {
  ...currencyCol,
  field: 'RCVs.contents',
  headerName: 'Contents RCV',
  valueGetter: (params) => params.row.RCVs?.contents || null,
  renderCell: (params) => renderCurrency(params, false),
};

export const BIRCVCol: GridColDef = {
  ...currencyCol,
  field: 'RCVs.BI',
  headerName: 'BI RCV',
  valueGetter: (params) => params.row.RCVs?.BI || null,
  renderCell: (params) => renderCurrency(params, false),
};
