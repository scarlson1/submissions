import React, { useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  Chip,
  ChipProps,
  Link,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  LoaderFunctionArgs,
  useLoaderData,
  useNavigate,
  Link as RouterLink,
} from 'react-router-dom';
import {
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowModel,
  GridRowParams,
  GridValueGetterParams,
} from '@mui/x-data-grid';
import {
  CloseRounded,
  CreditCardOffRounded,
  CreditScoreRounded,
  DoneRounded,
  EditRounded,
  HourglassBottomRounded,
  HourglassEmptyRounded,
  PaymentsRounded,
  SendRounded,
  VisibilityRounded,
} from '@mui/icons-material';

import { ADMIN_ROUTES, createPath } from 'router';
import { SubmissionQuoteData, submissionsQuotesCollection, QUOTE_STATUS, WithId } from 'common';

import { BasicDataGrid, renderGridEmail, renderGridPhone, GridCellCopy } from 'components';
import {
  formatGridCurrency,
  formatGridFirestoreTimestamp,
  formatGridPercent,
} from 'modules/utils/helpers';
import { useAsyncToast, useJsonDialog, useSendQuoteNotification } from 'hooks';
import { useConfirmation } from 'modules/components/ConfirmationService';

const getChipProps = (status: QUOTE_STATUS): Partial<ChipProps> => {
  switch (status) {
    case QUOTE_STATUS.AWAITING_USER:
      return { icon: <HourglassEmptyRounded />, color: 'primary' };
    case QUOTE_STATUS.PROCESSING_PAYMENT:
      return { icon: <PaymentsRounded />, color: 'info' };
    case QUOTE_STATUS.AWAITING_PAYMENT:
      return { icon: <CreditCardOffRounded />, color: 'info' };
    case QUOTE_STATUS.COMPLETE:
      return { icon: <DoneRounded />, color: 'success' };
    case QUOTE_STATUS.PAID:
      return { icon: <CreditScoreRounded />, color: 'success' };
    case QUOTE_STATUS.EXPIRED:
      return { icon: <HourglassBottomRounded />, color: 'warning' };
    case QUOTE_STATUS.CANCELLED:
      return { icon: <CloseRounded />, color: 'default' };
    default:
      return { color: 'default' };
  }
};

export const quotesLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    // TODO: pass query params for order, limit, etc.
    return getDocs(
      query(submissionsQuotesCollection, orderBy('metadata.created', 'desc'), limit(100))
    ).then((querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id })));
  } catch (err) {
    throw new Response(`Error fetching submissions`);
  }
};

const useUpdateQuote = () => {
  const update = useCallback(async (id: string, updateValues: Partial<SubmissionQuoteData>) => {
    const ref = doc(submissionsQuotesCollection, id);
    await updateDoc(ref, { status: updateValues.status, 'metadata.updated': Timestamp.now() });
    // await updateDoc(ref, { ...updateValues, 'metadata.updated': Timestamp.now() });

    const snap = await getDoc(ref);

    return { ...snap.data(), id: snap.id };
  }, []);

  return update;
};

export const Quotes: React.FC = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as WithId<SubmissionQuoteData>[];
  const dialog = useJsonDialog();
  const sendNotifications = useSendQuoteNotification();
  const updateQuote = useUpdateQuote();
  const modal = useConfirmation();
  const toast = useAsyncToast();
  const theme = useTheme();
  let fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

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
              <Tooltip placement='top' title='Details'>
                <VisibilityRounded />
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
        field: 'addressLine1',
        headerName: 'Address',
        minWidth: 200,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.addressLine1,
      },
      {
        field: 'addressLine2',
        headerName: 'Unit/Suite',
        minWidth: 80,
        flex: 0.4,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.addressLine2,
      },
      {
        field: 'city',
        headerName: 'City',
        minWidth: 150,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.city,
      },
      {
        field: 'state',
        headerName: 'State',
        minWidth: 72,
        flex: 0.1,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.state,
      },
      {
        field: 'postal',
        headerName: 'Postal',
        minWidth: 100,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.insuredAddress.postal,
      },
      {
        field: 'quoteTotal',
        headerName: 'Quote Total',
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
      },
      {
        field: 'status',
        headerName: 'Status',
        type: 'singleSelect',
        valueOptions: [
          QUOTE_STATUS.COMPLETE,
          QUOTE_STATUS.PAID,
          QUOTE_STATUS.AWAITING_PAYMENT,
          QUOTE_STATUS.PROCESSING_PAYMENT,
          QUOTE_STATUS.CANCELLED,
          QUOTE_STATUS.EXPIRED,
          QUOTE_STATUS.AWAITING_USER,
        ],
        minWidth: 180,
        flex: 0.8,
        editable: true,
        renderCell: (params: GridRenderCellParams) => (
          <Chip
            label={params.value}
            size='small'
            variant='outlined'
            {...getChipProps(params.value)}
          />
        ),
        // preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
        //   const hasError = params.props.value.length < 3;
        //   return { ...params.props, error: hasError };
        // },
      },
      {
        field: 'InsuredName',
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
        field: 'insuredEmail',
        headerName: 'Insured Email',
        minWidth: 220,
        flex: 1,
        editable: false,
        renderCell: renderGridEmail,
      },
      {
        field: 'insuredPhone',
        headerName: 'Insured Phone',
        minWidth: 140,
        flex: 1,
        editable: false,
        renderCell: renderGridPhone,
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
      {
        field: 'limitA',
        headerName: 'Limit A',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.limits.limitA,
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitB',
        headerName: 'Limit B',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.limits.limitB,
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitC',
        headerName: 'Limit C',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.limits.limitC,
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'limitD',
        headerName: 'Limit D',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.limits.limitD,
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'deductible',
        headerName: 'Deductible',
        minWidth: 100,
        flex: 0.5,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'replacementCost',
        headerName: 'Replacement Cost',
        minWidth: 140,
        flex: 0.8,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: formatGridCurrency,
      },
      {
        field: 'subproducerCommission',
        headerName: 'Commission',
        minWidth: 120,
        flex: 0.8,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueFormatter: (params) => formatGridPercent(params, 0),
      },
      {
        field: 'agentName',
        headerName: 'Agent Name',
        minWidth: 180,
        flex: 0.8,
        editable: false,
      },
      {
        field: 'agentEmail',
        headerName: 'Agent Email',
        minWidth: 220,
        flex: 0.8,
        editable: false,
        renderCell: renderGridEmail,
      },
      {
        field: 'agentPhone',
        headerName: 'Agent Email',
        minWidth: 140,
        flex: 0.8,
        editable: false,
        renderCell: renderGridPhone,
      },
      {
        field: 'agencyName',
        headerName: 'Agency',
        minWidth: 180,
        flex: 0.8,
        editable: false,
      },
      {
        field: 'created',
        headerName: 'Created',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.metadata?.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'updated',
        headerName: 'Updated',
        minWidth: 180,
        flex: 1,
        editable: false,
        valueGetter: (params: GridValueGetterParams) => params.row.metadata?.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'agentId',
        headerName: 'Agent ID',
        minWidth: 260,
        flex: 1,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
      {
        field: 'userId',
        headerName: 'User ID',
        minWidth: 260,
        flex: 1,
        editable: false,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
      {
        field: 'id',
        headerName: 'Quote ID',
        minWidth: 240,
        flex: 1,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
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

  const processRowUpdate = useCallback(
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
        const res = await updateQuote(newRow.id, {
          status: newRow.status,
        });

        toast.success(`Saved!`);
        return res;
      } catch (err) {
        return oldRow;
      }
    },
    [updateQuote, toast, modal, fullScreen]
  );

  const handleProcessRowUpdateError = useCallback(
    (err: Error) => {
      toast.error('update failed');
      console.log('ERROR: ', err);
    },
    [toast]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 2 }}>
        <Typography variant='h5' sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
          Quotes
        </Typography>
        <Button
          onClick={() =>
            navigate(createPath({ path: ADMIN_ROUTES.QUOTE_NEW, params: { productId: 'flood' } }))
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
          density='compact'
          autoHeight
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          experimentalFeatures={{ newEditingApi: true }}
          // onRowClick={(params) => {
          //   navigate(
          //     createPath({
          //       path: ADMIN_ROUTES.SUBMISSION_VIEW,
          //       params: { submissionId: params.id.toString() },
          //     })
          //   );
          // }}
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
              },
            },
            sorting: {
              sortModel: [{ field: 'created', sort: 'desc' }],
            },
            pagination: { pageSize: 10 },
          }}
        />
      </Box>
      {/* <Box sx={{ typography: 'body2' }}>
        <ReactJson
          src={data}
          theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
          style={{ background: 'transparent' }}
          iconStyle='circle'
          enableClipboard
          collapseStringsAfterLength={100}
        />
      </Box> */}
    </Box>
  );
};
