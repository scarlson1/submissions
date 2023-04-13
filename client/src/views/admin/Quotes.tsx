import React, { useCallback, useMemo } from 'react';
import { Box, Button, Link, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { doc, getDoc, getFirestore, limit, orderBy, updateDoc } from 'firebase/firestore';
import {
  GridActionsCellItem,
  GridColDef,
  GridRowModel,
  GridRowParams,
  GridToolbar,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import { DataObjectRounded, EditRounded, SendRounded } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

import { ADMIN_ROUTES, createPath } from 'router';
import {
  SubmissionQuoteData,
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
  orgNameCol,
  nestedAgentUserIdCol,
  userIdCol,
  idCol,
} from 'common';
import { BasicDataGrid, GridCellCopy } from 'components';
import { formatGridCurrency } from 'modules/utils/helpers';
import { useAsyncToast, useCollectionData, useJsonDialog, useSendQuoteNotification } from 'hooks';
import { useConfirmation } from 'modules/components';
import { submissionQuoteConverter } from 'common/firestoreConverters';

const useUpdateQuote = () => {
  const update = useCallback(async (id: string, updateValues: Partial<SubmissionQuoteData>) => {
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
    async (
      newRow: GridRowModel<WithId<SubmissionQuoteData>>,
      oldRow: GridRowModel<WithId<SubmissionQuoteData>>
    ) => {
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
        ...addrLine1Col,
        field: 'insuredAddress.addressLine1',
        headerName: 'Insured Address 1',
        valueGetter: (params) => params.row.insuredAddress.addressLine1,
      },
      {
        ...addrLine2Col,
        field: 'insuredAddress.addressLine2',
        headerName: 'Unit/Suite',
        valueGetter: (params) => params.row.insuredAddress.addressLine2,
      },
      {
        ...addrCityCol,
        field: 'insuredAddress.city',
        valueGetter: (params) => params.row.insuredAddress.city,
      },
      {
        ...addrStateCol,
        field: 'insuredAddress.state',
        valueGetter: (params) => params.row.insuredAddress.state,
      },
      {
        ...addrPostalCol,
        field: 'insuredAddress.postal',
        valueGetter: (params) => params.row.insuredAddress.postal,
      },
      {
        ...currencyCol,
        field: 'quoteTotal',
        headerName: 'Quote Total',
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
      {
        field: 'insuredName',
        headerName: 'Insured Name',
        minWidth: 160,
        flex: 0.8,
        editable: false,
        valueGetter: (params: GridValueGetterParams) =>
          `${params.row.insuredFirstName || ''} ${params.row.insuredLastName || ''}`.trim(),
      },
      {
        field: 'insuredLastName',
        headerName: 'Last Name',
        minWidth: 140,
        flex: 1,
        editable: false,
      },
      {
        field: 'insuredFirstName',
        headerName: 'First Name',
        minWidth: 140,
        flex: 1,
        editable: false,
      },
      {
        ...emailCol,
        field: 'insuredEmail',
        headerName: 'Insured Email',
      },
      {
        ...phoneCol,
        field: 'insuredPhone',
        headerName: 'Insured Phone',
      },
      {
        field: 'termPremium',
        headerName: 'Term Premium',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      limitACol,
      limitBCol,
      limitCCol,
      limitDCol,
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
      {
        field: 'agentName',
        headerName: 'Agent Name',
        minWidth: 180,
        flex: 0.8,
        editable: false,
      },
      {
        ...emailCol,
        field: 'agentEmail',
        headerName: 'Agent Email',
      },
      {
        ...phoneCol,
        field: 'agentPhone',
        headerName: 'Agent Email',
      },
      {
        ...orgNameCol,
        field: 'agencyName',
        headerName: 'Agency',
      },
      createdCol,
      updatedCol,
      {
        ...nestedAgentUserIdCol,
        valueGetter: (params: GridValueGetterParams) => params.row.agentId || null,
        // field: 'agentId',
        // headerName: 'Agent ID',
        // minWidth: 260,
        // flex: 1,
        // renderCell: (params) => {
        //   return <GridCellCopy value={params.value} />;
        // },
      },
      userIdCol,

      {
        ...idCol,
        headerName: 'Quote ID',
      },
      {
        field: 'submissionId',
        headerName: 'Submission ID',
        description: 'Submission from which the quote was created',
        minWidth: 240,
        flex: 1,
        renderCell: (params) => {
          if (!params.value) return null;
          return (
            <Link
              component={RouterLink}
              to={createPath({
                path: ADMIN_ROUTES.SUBMISSION_VIEW,
                params: { submissionId: params.value },
              })}
            >
              <GridCellCopy value={params.value} />
            </Link>
          );
        },
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
          experimentalFeatures={{ newEditingApi: true }}
          // onRowDoubleClick={(params) => {
          //   navigate(
          //     createPath({
          //       path: ADMIN_ROUTES.SUBMISSION_VIEW,
          //       params: { submissionId: params.id.toString() },
          //     })
          //   );
          // }}
          components={{ Toolbar: GridToolbar }}
          componentsProps={{ toolbar: { csvOptions: { allColumns: true } } }}
          initialState={{
            columns: {
              columnVisibilityModel: {
                insuredFirstName: false,
                insuredLastName: false,
                addressLine2: false,
                postal: false,
                termPremium: false,
                updated: false,
                agentId: false,
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
            pagination: { pageSize: 10 },
          }}
        />
      </Box>
    </Box>
  );
};
