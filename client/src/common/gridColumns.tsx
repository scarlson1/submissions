import {
  CachedRounded,
  CheckRounded,
  CloseRounded,
  CreditScoreRounded,
  DisabledByDefaultRounded,
  DoneRounded,
  FiberNewRounded,
  FindInPageRounded,
  HourglassBottomRounded,
  HourglassEmptyRounded,
  HourglassTopRounded,
  OpenInNewRounded,
  PendingRounded,
  QueryBuilderRounded,
  RequestQuoteRounded,
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
// import { Link as RouterLink } from 'react-router-dom';

import { FileLink, renderGridEmail, renderGridPhone } from 'components';
import { GridCellCopy } from 'components';
import {
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
// import { ADMIN_ROUTES, createPath } from 'router';

const copyBaseProps: Partial<GridColDef> = {
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
  ...copyBaseProps,
  // flex: 1,
  // minWidth: 200,
  // editable: false,
  // renderCell: (params: GridRenderCellParams<any, any, any>) => {
  //   return <GridCellCopy value={params.value} />;
  // },
};

export const emailCol: GridColDef = {
  field: 'email',
  headerName: 'Email',
  flex: 1,
  minWidth: 180,
  editable: false,
  renderCell: (params: GridRenderCellParams<any, any, any>) => renderGridEmail(params),
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
  minWidth: 120,
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
  minWidth: 180,
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
  renderCell: ({ value }: GridRenderCellParams<any, any, any>) => (
    <FileLink
      filepath={value}
      url={value}
      fileType='.pdf'
      typographyProps={{ variant: 'body2', fontWeight: 'fontWeightMedium' }}
      linkProps={{ underline: 'hover' }}
    />
  ),
};

export const addressSummaryCol: GridColDef = {
  field: 'address',
  headerName: 'Address',
  minWidth: 260,
  flex: 1,
  editable: false,
  valueGetter: (params: GridValueGetterParams<any, any>) =>
    `${params.row.address.addressLine1}, ${params.row.address.city}, ${params.row.address.state}`,
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
  // type: 'singleSelect',
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
  valueGetter: (params) => params.row.limits?.limitA || null,
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
  valueGetter: (params) => params.row.limits?.limitB || null,
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
  valueGetter: (params) => params.row.limits?.limitC || null,
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
  valueGetter: (params) => params.row.limits?.limitD || null,
  valueFormatter: formatGridCurrency,
};

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
  field: 'insuredName',
  headerName: 'Insured Name',
  minWidth: 160,
  flex: 0.8,
  editable: false,
  valueGetter: (params: GridValueGetterParams) =>
    `${params.row.namedInsured?.firstName || ''} ${
      params.row.namedInsured?.lastName || ''
    }`.trim() || null,
};

export const namedInsuredFirstNameCol: GridColDef = {
  field: 'insured.lastName',
  headerName: 'Last Name',
  minWidth: 140,
  flex: 1,
  editable: false,
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.lastName || null,
};

export const namedInsuredLastNameCol: GridColDef = {
  field: 'insured.firstName',
  headerName: 'First Name',
  minWidth: 140,
  flex: 1,
  editable: false,
  valueGetter: (params: GridValueGetterParams) => params.row.namedInsured?.firstName || null,
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
  minWidth: 140,
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
  field: 'inlandAAL',
  headerName: 'inlandAAL',
  description: 'Inland Peril Average Annual Loss from Swiss Re',
  minWidth: 150,
  flex: 0.8,
  valueGetter: (params) => params.value || null,
  renderCell: (params) => {
    return <GridCellCopy value={params.value} />;
  },
};

export const surgeAALCol: GridColDef = {
  field: 'surgeAAL',
  headerName: 'surgeAAL',
  description: 'Surge Peril Average Annual Loss from Swiss Re',
  minWidth: 150,
  flex: 0.8,
  valueGetter: (params) => params.value || null,
  renderCell: (params) => {
    return <GridCellCopy value={params.value} />;
  },
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
