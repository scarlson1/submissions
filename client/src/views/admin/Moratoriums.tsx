import React, { useCallback, useMemo, Suspense } from 'react';
import { Box, Button, Card, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material';
import {
  BlockRounded,
  CheckRounded,
  CloseRounded,
  DataObjectRounded,
  MapRounded,
} from '@mui/icons-material';
import {
  doc,
  getDoc,
  getFirestore,
  limit,
  orderBy,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import {
  GridActionsCellItem,
  GridColDef,
  GridRowId,
  GridRowModel,
  GridRowParams,
} from '@mui/x-data-grid';
import { ErrorBoundary } from 'react-error-boundary';

import { ADMIN_ROUTES, createPath } from 'router';
import { BasicDataGrid, ConfirmationDialog } from 'components';
import {
  formatFirestoreTimestamp,
  formatGridFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
  isCurrentDateBetween,
} from 'modules/utils';
import { GridCellCopy, renderChips } from 'components/RenderGridCellHelpers';
import { FIPSDetails, Moratorium, moratoriumsCollection, MoratoriumWithId } from 'common';
import { useConfirmation } from 'modules/components/ConfirmationService';
import { CountiesMap } from 'elements';
import { useAsyncToast, useCollectionData, useJsonDialog } from 'hooks';

// TODO: lazy load map component in modal

const useUpdateMoratorium = () => {
  const update = useCallback(async (id: string, updateValues: Partial<Moratorium>) => {
    const ref = doc(moratoriumsCollection(getFirestore()), id); // @ts-ignore
    await updateDoc(ref, { ...updateValues, 'metadata.updated': Timestamp.now() });

    const snap = await getDoc(ref);

    return { ...snap.data(), id: snap.id };
  }, []);

  return update;
};

const getMutationMsg = (
  newVals: GridRowModel<MoratoriumWithId>,
  old: GridRowModel<MoratoriumWithId>
) => {
  let changeItems = [];
  if (newVals.effectiveDate !== old.effectiveDate) {
    changeItems.push(
      `"effectiveDate" from ${formatFirestoreTimestamp(
        old.effectiveDate,
        'date'
      )} to ${formatFirestoreTimestamp(newVals.effectiveDate, 'date')}`
    );
  }
  if (newVals.expirationDate !== old.expirationDate) {
    const oldDisplay = old.expirationDate
      ? formatFirestoreTimestamp(old.expirationDate, 'date')
      : 'null';
    const newDisplay = newVals.expirationDate
      ? formatFirestoreTimestamp(newVals.expirationDate, 'date')
      : 'null';
    changeItems.push(`"expirationDate" from ${oldDisplay} to ${newDisplay}`);
  }
  return changeItems;
};

// export const moratoriumsLoader = async ({ params }: LoaderFunctionArgs) => {
//   try {
//     // TODO: pass query params for order, limit, etc. ??
//     return getDocs(
//       query(moratoriumsCollection(getFirestore()), orderBy('metadata.created', 'desc'), limit(100))
//     ).then((querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id })));
//   } catch (err) {
//     throw new Response(`Error fetching submissions`);
//   }
// };

export const Moratoriums: React.FC = () => {
  const navigate = useNavigate();
  const modal = useConfirmation();
  const theme = useTheme();
  const dialog = useJsonDialog();
  // const data = useLoaderData() as MoratoriumWithId[];
  const { data, status } = useCollectionData<Moratorium>('MORATORIUMS', [
    orderBy('metadata.created', 'desc'),
    limit(100),
  ]);
  const updateMoratorium = useUpdateMoratorium();
  const toast = useAsyncToast();
  let fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const showDetails = useCallback(
    (id: GridRowId) => async () => {
      // @ts-ignore
      const d = data.find((m) => m.id === id);
      if (!d) return;

      await dialog(d, `Moratorium ${id}`);
    },
    [dialog, data]
  );

  const showMap = useCallback(
    (id: GridRowId) => async () => {
      // @ts-ignore
      const d = data.find((m) => m.id === id);
      if (!d) return;

      modal({
        variant: 'info',
        title: (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant='h6'>Moratorium</Typography>
            <Typography variant='subtitle2' color='text.secondary'>{`${formatFirestoreTimestamp(
              d.effectiveDate,
              'date'
            )} - ${
              d.expirationDate ? formatFirestoreTimestamp(d.expirationDate, 'date') : 'Indefinite'
            }`}</Typography>
          </Box>
        ),
        catchOnCancel: false,
        component: (
          <ConfirmationDialog
            onAccept={() => {}}
            onClose={() => {}}
            open={false}
            dialogProps={{ maxWidth: 'md' }}
            dialogContentProps={{ dividers: true }}
          >
            <ErrorBoundary FallbackComponent={() => <div>Error loading map & county data</div>}>
              <Card sx={{ height: 500, width: '100%' }}>
                <Suspense
                  fallback={
                    <Typography align='center' sx={{ py: 5 }}>
                      Loading counties...
                    </Typography>
                  }
                >
                  <CountiesMap
                    selectedCounties={d.locationDetails}
                    layerProps={{
                      getFillColor: (f: any) =>
                        !!d?.locationDetails?.some(
                          (c: FIPSDetails) => `${c.stateFP}${c.countyFP}` === f.properties?.GEOID
                        )
                          ? [0, 125, 255, 50]
                          : [255, 255, 255, 20],
                    }}
                  />
                </Suspense>
              </Card>
            </ErrorBoundary>
          </ConfirmationDialog>
        ),
      });
    },
    [data, modal]
  );

  const deactivate = useCallback(
    (id: GridRowId) => async () => {
      alert('Deactivation not set up yet.');
    },
    []
  );

  // const moratoriumColumns: GridColDef[] = useMemo<GridColumns<any>>(
  const moratoriumColumns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 100,
        getActions: (params: GridRowParams) => [
          <GridActionsCellItem
            icon={
              <Tooltip title='view all data' placement='top'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={showDetails(params.id)}
            label='View Counties'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='show map' placement='top'>
                <MapRounded />
              </Tooltip>
            }
            onClick={showMap(params.id)}
            label='Show Map'
          />,
          <GridActionsCellItem
            icon={
              <Tooltip title='deactivate' placement='top'>
                <BlockRounded />
              </Tooltip>
            }
            onClick={deactivate(params.id)}
            label='Deactivate'
          />,
        ],
      },
      {
        field: 'active',
        headerName: 'Active',
        type: 'boolean',
        description:
          'Current date is after effective date (if exists) and before expiration (if exists)',
        minWidth: 80,
        flex: 0.5,
        headerAlign: 'center',
        align: 'center',
        editable: false,
        valueGetter: (params) =>
          isCurrentDateBetween(
            params.row.effectiveDate?.toDate(),
            params.row.expirationDate?.toDate()
          ),
        renderCell: (params) => {
          const isActive = !!params.value;

          if (isActive) return <CheckRounded color='success' fontSize='small' />;
          return <CloseRounded color='disabled' fontSize='small' />;
        },
      },
      {
        field: 'locations',
        headerName: 'FIPS',
        minWidth: 200,
        flex: 1,
        editable: false,
      },
      {
        field: 'locationDetails',
        headerName: 'Counties',
        minWidth: 280,
        flex: 1,
        editable: false,
        valueGetter: (params) => {
          const ld = params.row.locationDetails;
          if (ld) return ld.map((l: any) => l.countyName);
          return [];
        },
        renderCell: renderChips,
      },
      {
        field: 'count',
        headerName: 'Count',
        description: 'Total count of counties included in moratorium',
        minWidth: 100,
        flex: 1,
        editable: false,
        headerAlign: 'center',
        align: 'right',
        valueGetter: (params) => params.row.locations.length || null,
      },
      {
        field: 'effectiveDate',
        headerName: 'Effective Date',
        minWidth: 160,
        flex: 0.6,
        type: 'date',
        editable: true,
        valueGetter: (params) => params.row.effectiveDate || null,
        valueSetter: (params) => {
          let newVal =
            params.value instanceof Date ? Timestamp.fromDate(params.value) : params.value;
          return { ...params.row, effectiveDate: newVal };
        },
        valueFormatter: formatGridFirestoreTimestampAsDate,
      },
      {
        field: 'expirationDate',
        headerName: 'Expiration Date',
        minWidth: 160,
        flex: 0.6,
        type: 'date',
        editable: true,
        // preProcessEditCellProps: (params: GridPreProcessEditCellProps) => {
        //   // const hasError = params.props.value.length < 3;
        //   return { ...params.props, error: false }; // hasError };
        // },
        valueGetter: (params) => params.row.expirationDate || null,
        valueSetter: (params) => {
          let newVal =
            params.value instanceof Date ? Timestamp.fromDate(params.value) : params.value;
          return { ...params.row, expirationDate: newVal };
        },
        valueFormatter: formatGridFirestoreTimestampAsDate,
      },
      {
        field: 'created',
        headerName: 'Created',
        minWidth: 180,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'updated',
        headerName: 'Updated',
        minWidth: 180,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.updated || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'id',
        headerName: 'Doc ID',
        minWidth: 180,
        flex: 0.6,
        editable: false,
        renderCell: (params) => {
          return <GridCellCopy value={params.value} />;
        },
      },
    ],
    [showDetails, showMap, deactivate]
  );

  const processRowUpdate = useCallback(
    async (newRow: GridRowModel<MoratoriumWithId>, oldRow: GridRowModel<MoratoriumWithId>) => {
      // TODO: get diff fields / values and show in confirmation
      // https://mui.com/x/react-data-grid/editing/#ask-for-confirmation-before-saving
      const mutationItems = getMutationMsg(newRow, oldRow);

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
              <ul>
                {mutationItems.map((i) => (
                  <li key={i}>
                    <Typography variant='body2' color='text.secondary'>
                      {i}
                    </Typography>
                  </li>
                ))}
              </ul>
            </>
          ),
          confirmButtonText: 'Confirm',
          dialogContentProps: { dividers: true },
          dialogProps: { fullScreen },
        });
        toast.loading('saving...');
        const res = await updateMoratorium(newRow.id, {
          effectiveDate: newRow.effectiveDate,
          expirationDate: newRow.expirationDate,
        });

        toast.success(`Saved!`);
        return res;
      } catch (err) {
        return oldRow;
      }
    },
    [updateMoratorium, toast, modal, fullScreen]
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant='h5' gutterBottom sx={{ ml: { xs: 0, sm: 3, md: 4 } }}>
          Moratoriums
        </Typography>
        <Button onClick={() => navigate(createPath({ path: ADMIN_ROUTES.MORATORIUM_NEW }))}>
          New
        </Button>
      </Box>
      <Box sx={{ height: 500, width: '100%' }}>
        <BasicDataGrid
          rows={data || []}
          columns={moratoriumColumns}
          loading={status === 'loading'}
          density='compact'
          autoHeight
          initialState={{
            columns: {
              columnVisibilityModel: {
                id: false,
              },
            },
            sorting: {
              sortModel: [{ field: 'created', sort: 'desc' }],
            },
            // pagination: { paginationModel: { pageSize: 5 } },
            pagination: { pageSize: 10 },
          }}
          processRowUpdate={processRowUpdate}
          onProcessRowUpdateError={handleProcessRowUpdateError}
          experimentalFeatures={{ newEditingApi: true }}
        />
      </Box>
    </Box>
  );
};
