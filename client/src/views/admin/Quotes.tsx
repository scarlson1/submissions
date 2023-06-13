import React, { useCallback, useMemo } from 'react';
import { Box, Button, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, getFirestore, limit, orderBy, updateDoc } from 'firebase/firestore';
import {
  GridActionsCellItem,
  GridColDef,
  GridRowModel,
  GridRowParams,
  GridToolbar,
} from '@mui/x-data-grid';
import { DataObjectRounded, EditRounded, SendRounded } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import { ADMIN_ROUTES, createPath } from 'router';
import {
  Quote,
  submissionsQuotesCollection,
  QUOTE_STATUS,
  WithId,
  addrLine1Col,
  addrLine2Col,
  addrCityCol,
  addrStateCol,
  addrPostalCol,
  currencyCol,
  statusCol,
  emailCol,
  phoneCol,
  limitACol,
  limitBCol,
  limitCCol,
  limitDCol,
  tivCol,
  deductibleCol,
  ratingDataReplacementCostCol,
  ratingDataPropertyCodeCol,
  ratingDataYearBuiltCol,
  ratingDataSqFootageCol,
  ratingDataNumStoriesCol,
  ratingDataBasementCol,
  ratingDataDistToCoastFeetCol,
  ratingDataCBRSCol,
  ratingDataFloodZoneCol,
  subproducerCommissionCol,
  createdCol,
  updatedCol,
  nestedAgentUserIdCol,
  userIdCol,
  idCol,
  namedInsuredFirstNameCol,
  namedInsuredLastNameCol,
  namedInsuredDisplayNameCol,
  nestedAgentNameCol,
  agencyNameCol,
  namedInsuredEmailCol,
  namedInsuredPhoneCol,
  addrCountyCol,
  addrFIPSCol,
  copyBaseProps,
  annualPremiumCol,
} from 'common';
import { BasicDataGrid } from 'components';
import { useAsyncToast, useCollectionData, useJsonDialog, useSendQuoteNotification } from 'hooks';
import { useConfirmation } from 'modules/components';
import { submissionQuoteConverter } from 'common/firestoreConverters';

const useUpdateQuote = () => {
  const update = useCallback(async (id: string, updateValues: Partial<Quote>) => {
    const ref = doc(submissionsQuotesCollection(getFirestore()), id).withConverter(
      submissionQuoteConverter
    );
    await updateDoc(ref, { status: updateValues.status });

    const snap = await getDoc(ref);
    console.log('updated data: ', snap.data());

    return { ...snap.data(), id: snap.id };
  }, []);

  return update;
};

export const useConfirmAndUpdate = (updateFn: (id: string, vals: Partial<any>) => Promise<any>) => {
  const modal = useConfirmation();
  const toast = useAsyncToast();
  const theme = useTheme();
  let fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const confirm = useCallback(
    async (newRow: GridRowModel<WithId<Quote>>, oldRow: GridRowModel<WithId<Quote>>) => {
      let changeMsg =
        newRow.status !== oldRow.status
          ? `"status" from ${oldRow.status} to ${newRow.status}`
          : null;

      try {
        await modal({
          variant: 'danger',
          catchOnCancel: true,
          title: 'Are you sure?',
          description: (
            <>
              <Typography variant='body2' color='text.secondary'>
                You are about to make the following changes:
              </Typography>
              <Typography>{changeMsg}</Typography>
            </>
          ),
          confirmButtonText: 'Confirm',
          dialogContentProps: { dividers: true },
          dialogProps: { fullScreen },
        });

        toast.loading('saving...');
        const res = await updateFn(newRow.id, {
          status: newRow.status,
        });

        toast.success(`Saved!`);
        return res;
      } catch (err) {
        toast.error('update failed');
        return oldRow;
      }
    },
    [modal, toast, updateFn, fullScreen]
  );

  return confirm;
};

export const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const { data, status } = useCollectionData('SUBMISSIONS_QUOTES', [
    orderBy('metadata.created', 'desc'),
    limit(100),
  ]); // TODO: add constraints for filtering / sorting
  const dialog = useJsonDialog();
  const sendNotifications = useSendQuoteNotification();
  const updateQuote = useUpdateQuote();
  const confirmAndUpdate = useConfirmAndUpdate(updateQuote);

  const showJson = useCallback(
    (params: GridRowParams) => () => {
      let d = data.find((q) => q.id === params.id);
      if (!d) return;
      dialog(d, `Quote Data ${params.id}`);
    },
    [data, dialog]
  );

  const editQuote = useCallback(
    (params: GridRowParams) => () => {
      // navigate(createPath({ path: ADMIN_ROUTES.QUOTE_EDIT, }))
      alert('Not implemented yet.');
    },
    []
  );

  const handleSendNotifications = useCallback(
    (params: GridRowParams) => () => {
      sendNotifications(params.id as string);
    },
    [sendNotifications]
  );

  const quoteColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 120,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='View Raw JSON'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={showJson(params)}
            label='Details'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Edit'>
                <EditRounded />
              </Tooltip>
            }
            onClick={editQuote(params)}
            label='Send Notifications'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip placement='top' title='Send Notifications'>
                <SendRounded />
              </Tooltip>
            }
            onClick={handleSendNotifications(params)}
            label='Send Notifications'
          />,
        ],
      },
      {
        ...statusCol,
        type: 'singleSelect',
        valueOptions: [
          QUOTE_STATUS.BOUND,
          QUOTE_STATUS.CANCELLED,
          QUOTE_STATUS.EXPIRED,
          QUOTE_STATUS.AWAITING_USER,
        ],
      },
      addrLine1Col,
      addrLine2Col,
      addrCityCol,
      addrStateCol,
      addrPostalCol,
      addrCountyCol,
      addrFIPSCol,
      // termPremiumCol,
      annualPremiumCol,
      {
        ...currencyCol,
        field: 'quoteTotal',
        headerName: 'Quote Total',
      },
      namedInsuredDisplayNameCol,
      namedInsuredFirstNameCol,
      namedInsuredLastNameCol,
      namedInsuredEmailCol,
      namedInsuredPhoneCol,
      limitACol,
      limitBCol,
      limitCCol,
      limitDCol,
      tivCol,
      deductibleCol,
      ratingDataReplacementCostCol,
      ratingDataPropertyCodeCol,
      ratingDataYearBuiltCol,
      ratingDataSqFootageCol,
      ratingDataNumStoriesCol,
      ratingDataBasementCol,
      ratingDataDistToCoastFeetCol,
      ratingDataCBRSCol,
      ratingDataFloodZoneCol,
      subproducerCommissionCol,
      nestedAgentNameCol,
      {
        ...emailCol,
        field: 'agent.email',
        headerName: 'Agent Email',
        valueGetter: (params) => params.row.agent?.email || null,
      },
      {
        ...phoneCol,
        field: 'agent.phone',
        headerName: 'Agent Phone',
        valueGetter: (params) => params.row.agent?.phone || null,
      },
      agencyNameCol,
      createdCol,
      updatedCol,
      nestedAgentUserIdCol,
      { ...userIdCol, description: 'userId of record owner (named insured in most cases)' },
      {
        ...idCol,
        headerName: 'Quote ID',
      },
      {
        field: 'submissionId',
        headerName: 'Submission ID',
        description: 'Submission from which the quote was created',
        ...copyBaseProps,
      },
    ],
    [showJson, editQuote, handleSendNotifications]
  );

  const handleProcessRowUpdateError = useCallback((err: Error) => {
    toast.error('update failed');
    console.log('ERROR: ', err);
  }, []);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
          Quotes
        </Typography>
        <Button
          onClick={() =>
            navigate(
              createPath({ path: ADMIN_ROUTES.QUOTE_NEW_BLANK, params: { productId: 'flood' } })
            )
          }
          sx={{ maxHeight: 36 }}
        >
          New Quote
        </Button>
      </Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <BasicDataGrid
          rows={data || []}
          columns={quoteColumns}
          loading={status === 'loading'}
          density='compact'
          autoHeight
          processRowUpdate={confirmAndUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          // experimentalFeatures={{ newEditingApi: true }} // v5
          // onRowDoubleClick={(params) => {
          //   navigate(
          //     createPath({
          //       path: ADMIN_ROUTES.SUBMISSION_VIEW,
          //       params: { submissionId: params.id.toString() },
          //     })
          //   );
          // }}
          slots={{
            toolbar: GridToolbar,
          }}
          slotProps={{
            toolbar: { csvOptions: { allColumns: true } },
          }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                'namedInsured.firstName': false,
                'namedInsured.lastName': false,
                // 'address.addressLine2': false,
                // 'address.postal': false,
                addressLine2: false,
                postal: false,
                // termPremium: false,
                // annualPremium: false,
                updated: false,
                'agent.userId': false,
                CBRSDesignation: false,
                basement: false,
                distToCoastFeet: false,
                floodZone: false,
                numStories: false,
                propertyCode: false,
                sqFootage: false,
                yearBuilt: false,
              },
            },
            sorting: {
              sortModel: [{ field: 'created', sort: 'desc' }],
            },
            // pagination: { pageSize: 10 },
            pagination: { paginationModel: { pageSize: 10 } },
          }}
        />
      </Box>
    </Box>
  );
};
