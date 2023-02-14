import React, { useCallback, useMemo } from 'react';
import { Box, Button, Card, Typography, useTheme } from '@mui/material';
import { BlockRounded, MapRounded, VisibilityRounded } from '@mui/icons-material';
import { getDocs, limit, orderBy, query } from 'firebase/firestore';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import {
  GridActionsCellItem,
  GridColDef,
  // GridColumns,
  GridRowId,
  GridRowParams,
} from '@mui/x-data-grid';
import ReactJson from '@microlink/react-json-view';

import { ADMIN_ROUTES, createPath } from 'router';
import { BasicDataGrid, ConfirmationDialog } from 'components';
import {
  formatFirestoreTimestamp,
  formatGridFirestoreTimestamp,
  formatGridFirestoreTimestampAsDate,
} from 'modules/utils/helpers';
import { renderChips } from 'components/RenderGridCellHelpers';
import { FIPSDetails, moratoriumsCollection, MoratoriumWithId } from 'common';
import { useConfirmation } from 'modules/components/ConfirmationService';
import { DeckMap, defaultGeoJsonLayerProps } from 'elements';
import countiesData from 'assets/counties_20m.json';
import { GeoJsonLayer } from 'deck.gl/typed';

export const moratoriumsLoader = async ({ params }: LoaderFunctionArgs) => {
  try {
    // TODO: pass query params for order, limit, etc. ??
    return getDocs(
      query(moratoriumsCollection, orderBy('metadata.created', 'desc'), limit(100))
    ).then((querySnap) => querySnap.docs.map((snap) => ({ ...snap.data(), id: snap.id })));
  } catch (err) {
    throw new Response(`Error fetching submissions`);
  }
};

// const moratoriumColumns: GridColDef[] = [
//   {
//     field: 'actions',
//     type: 'actions',
//     getActions: (params: GridRowParams) => [
//       <GridActionsCellItem icon={...} onClick={...} label="Delete" />,
//       <GridActionsCellItem icon={...} onClick={...} label="Print" showInMenu />,
//     ]
//   },
//   {
//     field: 'id',
//     headerName: 'Doc ID',
//     minWidth: 160,
//     flex: 0.6,
//     editable: false,
//   },
//   {
//     field: 'locations',
//     headerName: 'FIPS',
//     minWidth: 200,
//     flex: 1,
//     editable: false,
//   },
//   {
//     field: 'locationDetails',
//     headerName: 'Counties',
//     minWidth: 200,
//     flex: 1,
//     editable: false,
//     valueGetter: (params) => {
//       const ld = params.row.locationDetails;
//       if (ld) return ld.map((l: any) => l.countyName);
//       return [];
//     },
//     renderCell: renderChips,
//     // TODO: show all button that opens modal
//   },
//   {
//     field: 'count',
//     headerName: 'Count',
//     minWidth: 100,
//     flex: 1,
//     editable: false,
//     valueGetter: (params) => params.row.locations.length || null,
//   },
//   {
//     field: 'effectiveDate',
//     headerName: 'Effective Date',
//     minWidth: 160,
//     flex: 0.6,
//     editable: false,
//     valueGetter: (params) => params.row.effectiveDate || null,
//     valueFormatter: formatGridFirestoreTimestampAsDate,
//   },
//   {
//     field: 'expirationDate',
//     headerName: 'Expiration Date',
//     minWidth: 160,
//     flex: 0.6,
//     editable: false,
//     valueGetter: (params) => params.row.expirationDate || null,
//     valueFormatter: formatGridFirestoreTimestampAsDate,
//   },

//   {
//     field: 'metadata.created',
//     headerName: 'Created',
//     minWidth: 160,
//     flex: 0.6,
//     editable: false,
//     valueGetter: (params) => params.row.metadata.created || null,
//     valueFormatter: formatGridFirestoreTimestamp,
//   },
//   {
//     field: 'metadata.updated',
//     headerName: 'Updated',
//     minWidth: 160,
//     flex: 0.6,
//     editable: false,
//     valueGetter: (params) => params.row.metadata.updated || null,
//     valueFormatter: formatGridFirestoreTimestamp,
//   },
// ];

export const Moratoriums: React.FC = () => {
  const navigate = useNavigate();
  const modal = useConfirmation();
  const theme = useTheme();
  const data = useLoaderData() as MoratoriumWithId[];
  // TODO: create ActiveCountiesMap ??

  const showDetails = useCallback(
    (id: GridRowId) => async () => {
      const d = data.find((m) => m.id === id);
      if (!d) return;

      modal({
        variant: 'info',
        title: 'SpatialKey Data',
        catchOnCancel: false,
        component: (
          <ConfirmationDialog
            onAccept={() => {}}
            onClose={() => {}}
            open={false}
            dialogProps={{ maxWidth: 'md' }}
            dialogContentProps={{ dividers: true }}
          >
            <ReactJson
              src={d}
              theme={theme.palette.mode === 'dark' ? 'tomorrow' : 'rjv-default'}
              style={{ background: 'transparent' }}
              iconStyle='circle'
              enableClipboard
              collapseStringsAfterLength={30}
            />
          </ConfirmationDialog>
        ),
      });
    },
    [modal, theme, data]
  );

  const showMap = useCallback(
    (id: GridRowId) => async () => {
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
              d.expirationDate ? formatFirestoreTimestamp(d.expirationDate) : 'Indefinite'
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
            <Card sx={{ height: 500, width: '100%' }}>
              <DeckMap
                // hoverInfo={hoverInfo}
                // renderTooltipContent={(info: PickingInfo) =>
                //   `${info.object.properties?.NAME} (${info.object.properties?.GEOID})`
                // }
                layers={[
                  new GeoJsonLayer({
                    ...defaultGeoJsonLayerProps,
                    id: `geojson-layer-counties`, // @ts-ignore
                    data: countiesData,
                    highlightColor:
                      theme.palette.mode === 'dark' ? [255, 255, 255, 25] : [80, 144, 211, 20],
                    getLineColor:
                      theme.palette.mode === 'dark' ? [255, 255, 255, 200] : [178, 186, 194, 200],
                    getFillColor: (f) =>
                      !!d.locationDetails.some(
                        (c: FIPSDetails) => `${c.stateFP}${c.countyFP}` === f.properties?.GEOID
                      )
                        ? [0, 125, 255, 50]
                        : [255, 255, 255, 20],
                    // onHover: (info: PickingInfo) => setHoverInfo(info),
                  }),
                ]}
              />
            </Card>
          </ConfirmationDialog>
        ),
      });
    },
    [data, modal, theme]
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
            icon={<VisibilityRounded />}
            onClick={showDetails(params.id)}
            label='View Counties'
          />,
          <GridActionsCellItem
            icon={<MapRounded />}
            onClick={showMap(params.id)}
            label='Show Map'
          />,
          <GridActionsCellItem
            icon={<BlockRounded />}
            onClick={deactivate(params.id)}
            label='Deactivate'
          />,
        ],
      },
      {
        field: 'id',
        headerName: 'Doc ID',
        minWidth: 160,
        flex: 0.6,
        editable: false,
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
        minWidth: 100,
        flex: 1,
        editable: false,
        valueGetter: (params) => params.row.locations.length || null,
      },
      {
        field: 'effectiveDate',
        headerName: 'Effective Date',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.effectiveDate || null,
        valueFormatter: formatGridFirestoreTimestampAsDate,
      },
      {
        field: 'expirationDate',
        headerName: 'Expiration Date',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.expirationDate || null,
        valueFormatter: formatGridFirestoreTimestampAsDate,
      },

      {
        field: 'metadata.created',
        headerName: 'Created',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.created || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
      {
        field: 'metadata.updated',
        headerName: 'Updated',
        minWidth: 160,
        flex: 0.6,
        editable: false,
        valueGetter: (params) => params.row.metadata.updated || null,
        valueFormatter: formatGridFirestoreTimestamp,
      },
    ],
    [showDetails, showMap, deactivate]
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
        />
      </Box>
    </Box>
  );
};
