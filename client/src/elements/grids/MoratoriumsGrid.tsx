import { DataObjectRounded, MapRounded } from '@mui/icons-material';
import { Box, Card, Tooltip, Typography } from '@mui/material';
import { GridActionsCellItem, GridColDef, GridRowId, GridRowParams } from '@mui/x-data-grid';
import { doc, getDoc } from 'firebase/firestore';
import { Suspense, useCallback, useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useFirestore } from 'reactfire';

import {
  FIPSDetails,
  Moratorium,
  ServerDataGridCollectionProps,
  moratoriumsCollection,
} from 'common';
import { ConfirmationDialog, ServerDataGrid } from 'components';
import { useConfirmation } from 'context';
import { useShowJson } from 'hooks';
import { moratoriumCols } from 'modules/muiGrid/gridColumnDefs';
import { formatFirestoreTimestamp } from 'modules/utils';
import { CountiesMap } from '../maps/CountiesMap';

export type MoratoriumGridProps = ServerDataGridCollectionProps;

export const MoratoriumsGrid = ({
  renderActions = () => [],
  additionalColumns = [],
  initialState,
  ...props
}: MoratoriumGridProps) => {
  const firestore = useFirestore();
  const modal = useConfirmation();
  const showJson = useShowJson<Moratorium>('moratoriums');

  const handleShowJson = useCallback(
    (params: GridRowParams) => () => showJson(params.id.toString()),
    [showJson]
  );

  // TODO: move to hook
  const showMap = useCallback(
    (id: GridRowId) => async () => {
      let d: Moratorium | undefined;
      try {
        const docRef = doc(moratoriumsCollection(firestore), id.toString());
        const snap = await getDoc(docRef);
        d = snap.data();
        if (!snap.exists || !d) throw new Error('Record not found');
      } catch (err: any) {
        console.log('Error fetching moratorium: ', err);
        return;
      }

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
    [modal, firestore]
  );

  const columns: GridColDef[] = useMemo(
    () => [
      {
        field: 'actions',
        headerName: 'Actions',
        type: 'actions',
        width: 100,
        getActions: (params: GridRowParams) => [
          ...renderActions(params),
          <GridActionsCellItem
            icon={
              <Tooltip title='view all data' placement='top'>
                <DataObjectRounded />
              </Tooltip>
            }
            onClick={handleShowJson(params)}
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
          // TODO: set up deactivate
          // <GridActionsCellItem
          //   icon={
          //     <Tooltip title='deactivate' placement='top'>
          //       <BlockRounded />
          //     </Tooltip>
          //   }
          //   onClick={deactivate(params.id)}
          //   label='Deactivate'
          // />,
        ],
      },
      ...moratoriumCols,
    ],
    [handleShowJson, showMap, renderActions]
  );

  return (
    <ServerDataGrid
      colName='moratoriums'
      columns={columns}
      density='compact'
      autoHeight
      initialState={{
        columns: {
          columnVisibilityModel: {
            id: false,
          },
        },
        sorting: {
          sortModel: [{ field: 'metadata.created', sort: 'desc' }],
        },
      }}
      {...props}
    />
  );
};
