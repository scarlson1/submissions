import React, { useCallback, useMemo } from 'react';
import { Box, Tooltip } from '@mui/material';
import { DataObjectRounded, FloodRounded, MapRounded } from '@mui/icons-material';
import { GridActionsCellItem, GridColDef, GridRowParams } from '@mui/x-data-grid';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore, useSigninCheck } from 'reactfire';

import { ServerDataGrid, ServerDataGridProps } from 'components';
import { useAsyncToast, useFloodFactor, useJsonDialog, useWidth } from 'hooks';
import { openGoogleMaps } from 'modules/utils';
import { CUSTOM_CLAIMS } from 'modules/components';
import {
  SUBMISSION_STATUS,
  Submission,
  coordinatesCol,
  latitudeCol,
  longitudeCol,
  deductibleCol,
  emailCol,
  createdCol,
  updatedCol,
  userIdCol,
  idCol,
  priorLossCountCol,
  ratingDataCBRSCol,
  inlandAALCol,
  surgeAALCol,
  annualPremiumCol,
  displayNameCol,
  firstNameCol,
  lastNameCol,
  statusCol,
  ratingDataFloodZoneCol,
  addrLine2Col,
  addrCityCol,
  addrStateCol,
  addrPostalCol,
  addrFIPSCol,
  addrCountyCol,
  addrLine1Col,
  ratingDataReplacementCostCol,
  ratingDataPropertyCodeCol,
  ratingDataYearBuiltCol,
  ratingDataSqFootageCol,
  ratingDataNumStoriesCol,
  ratingDataBasementCol,
  ratingDataDistToCoastFeetCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  tivCol,
  copyBaseProps,
  tsunamiAALCol,
  submissionsCollection,
  addressSummaryCol,
} from 'common';

export interface SubmissionsGridProps
  extends Omit<
    ServerDataGridProps,
    'columns' | 'collName' | 'isCollectionGroup' | 'columns' | 'pathSegments'
  > {
  renderActions?: (params: GridRowParams) => JSX.Element[];
}

export const SubmissionsGrid = ({ renderActions = () => [], ...props }: SubmissionsGridProps) => {
  const firestore = useFirestore();
  const toast = useAsyncToast();
  const openFF = useFloodFactor();
  const dialog = useJsonDialog();
  const { isSmall } = useWidth();

  const { data: iDAdminResult } = useSigninCheck({
    requiredClaims: { [CUSTOM_CLAIMS.IDEMAND_ADMIN]: true },
  });

  const openMap = useCallback(
    (params: GridRowParams<Submission>) => () => {
      const latitude = params.row.coordinates?.latitude;
      const longitude = params.row.coordinates?.longitude;
      if (!(latitude && longitude)) return toast.error('Missing coordinates');

      openGoogleMaps(latitude, longitude);
    },
    [toast]
  );

  // TODO: move to hook
  const openFloodFactor = useCallback(
    (params: GridRowParams<Submission>) => () => {
      const address = params.row.address;
      if (!(address && address.addressLine1)) return toast.error('Missing address');

      openFF(address);
    },
    [toast, openFF]
  );

  const openSubmissionDataDialog = useCallback(
    (params: GridRowParams<Submission>) => async () => {
      try {
        const subSnap = await getDoc(doc(submissionsCollection(firestore), params.id.toString()));

        const subData = subSnap.data();
        if (!subData) throw new Error(`Submission data not found for ID ${params.id.toString()}`);

        dialog(subData, `Submission Data ${params.id.toString()}`);
      } catch (err: any) {
        let msg = `Error fetching submission`;
        if (err?.message) msg = err.message;
        toast.error(msg);
      }
    },
    [firestore, dialog, toast]
  );

  const submissionColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: isSmall ? 80 : 160,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          // <GridActionsCellItem
          //   icon={
          //     <Tooltip title='Create Quote' placement='top'>
          //       <RequestQuoteRounded />
          //     </Tooltip>
          //   }
          //   onClick={handleCreateQuote(params.id)}
          //   label='Create Quote'
          // />,
          <GridActionsCellItem
            icon={
              <Tooltip title='Google Maps' placement='top'>
                <MapRounded />
              </Tooltip>
            }
            onClick={openMap(params)}
            label='Google Maps'
            showInMenu={isSmall}
          />,
          // TODO: flood factor hook
          <GridActionsCellItem
            icon={
              <Tooltip title='Flood Factor' placement='top'>
                <FloodRounded />
              </Tooltip>
            }
            onClick={openFloodFactor(params)}
            label='Google Maps'
            showInMenu={isSmall}
          />,
          // TODO: admin only
          <GridActionsCellItem
            icon={
              <Tooltip title='Show JSON' placement='top'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={openSubmissionDataDialog(params)}
            label='Show JSON'
            disabled={!iDAdminResult.hasRequiredClaims}
            showInMenu={isSmall}
          />,
        ],
      },
      {
        ...statusCol,
        type: 'singleSelect',
        valueOptions: [
          SUBMISSION_STATUS.QUOTED,
          SUBMISSION_STATUS.SUBMITTED,
          SUBMISSION_STATUS.NOT_ELIGIBLE,
          SUBMISSION_STATUS.PENDING_INFO,
          SUBMISSION_STATUS.CANCELLED,
          SUBMISSION_STATUS.DRAFT,
        ],
        editable: iDAdminResult?.hasRequiredClaims,
        filterable: true,
      },
      addressSummaryCol,
      {
        ...addrLine1Col,
        description: 'Submission address to be used for insured location',
      },
      addrLine2Col,
      addrCityCol,
      addrStateCol,
      addrPostalCol,
      addrCountyCol,
      addrFIPSCol,
      annualPremiumCol,
      deductibleCol,
      limitACol,
      limitBCol,
      limitCCol,
      limitDCol,
      tivCol,
      {
        ...displayNameCol,
        sortable: false,
        valueGetter: (params) => {
          if (params.value) return params.value;
          if (params.row.firstName || params.row.lastName)
            return `${params.row.firstName} ${params.row.lastName}`.trim();
          if (params.row.contact?.firstName || params.row.contact?.lastName)
            return `${params.row.contact?.firstName} ${params.row.contact?.lastName}`.trim();
          return null;
        },
      },
      {
        ...firstNameCol,
        valueGetter: (params) => params.row.contact?.firstName || null,
      },
      {
        ...lastNameCol,
        valueGetter: (params) => params.row.contact?.lastName || null,
      },
      {
        ...emailCol,
        valueGetter: (params) => params.row.contact?.email || null,
        description: 'Provided contact email',
      },
      // replacementCostCol,
      ratingDataReplacementCostCol,
      {
        field: 'exclusions',
        headerName: 'Exclusions',
        description: 'Exclusions selected by user',
        minWidth: 200,
        flex: 1,
        editable: false,
        // TODO: valueFormatter
      },
      priorLossCountCol,
      ratingDataDistToCoastFeetCol,
      ratingDataBasementCol,
      ratingDataNumStoriesCol,
      ratingDataPropertyCodeCol,
      ratingDataSqFootageCol,
      ratingDataYearBuiltCol,
      ratingDataFloodZoneCol,
      ratingDataCBRSCol,
      inlandAALCol,
      surgeAALCol,
      tsunamiAALCol,
      coordinatesCol,
      latitudeCol,
      longitudeCol,
      createdCol,
      updatedCol,
      {
        field: 'propertyDataDocId',
        headerName: 'Property Data Doc ID',
        description: 'Document ID for the property data response',
        valueGetter: (params) => params.row.propertyDataDocId || null,
        ...copyBaseProps,
      },
      {
        ...userIdCol,
        description:
          'user ID of the user that created submission (could have been anonymous if they were not signed in)',
      },
      {
        ...idCol,
        headerName: 'Submission ID',
        description: 'Document/database ID for the submission',
      },
    ],
    [openMap, openFloodFactor, openSubmissionDataDialog, renderActions, iDAdminResult, isSmall] // handleCreateQuote,
  );

  return (
    <Box sx={{ height: { xs: 400, sm: 460, md: 500 }, width: '100%' }}>
      <ServerDataGrid
        collName='SUBMISSIONS'
        columns={submissionColumns}
        density='compact'
        autoHeight
        // TODO: make "view submission" route exists for all user claim types
        // onCellDoubleClick={}
        initialState={{
          columns: {
            columnVisibilityModel: {
              firstName: false,
              lastName: false,
              'address.addressLine1': false,
              'address.addressLine2': false,
              'address.city': false,
              'address.state': false,
              'address.postal': false,
              'address.countyName': false,
              'address.countyFIPS': false,
              'limits.limitA': false,
              'limits.limitB': false,
              'limits.limitC': false,
              'limits.limitD': false,
              latitude: false,
              longitude: false,
              'AAL.inland': false,
              'AAL.surge': false,
              'AAL.tsunami': false,
              'metadata.updated': false,
              'ratingPropertyData.replacementCost': false,
              'ratingPropertyData.propertyCode': false,
              'ratingPropertyData.yearBuilt': false,
              'ratingPropertyData.sqFootage': false,
              'ratingPropertyData.numStories': false,
              'ratingPropertyData.basement': false,
              'ratingPropertyData.distToCoastFeet': false,
              'ratingPropertyData.CBRSDesignation': false,
              'ratingPropertyData.floodZone': false,
              // replacementCost: false,
              // propertyCode: false,
              // yearBuilt: false,
              // sqFootage: false,
              // numStories: false,
              // basement: false,
              // distToCoastFeet: false,
              // CBRSDesignation: false,
              // floodZone: false,
              priorLossCount: false,
              propertyDataDocId: false,
            },
          },
          sorting: {
            sortModel: [{ field: 'metadata.created', sort: 'desc' }],
          },
          pagination: { paginationModel: { page: 0, pageSize: 10 } },
        }}
        {...props}
      />
    </Box>
  );
};
