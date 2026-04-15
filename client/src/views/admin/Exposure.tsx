import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Chip, Tab } from '@mui/material';
import { GridColDef } from '@mui/x-data-grid';
import { useSearchParams } from 'react-router-dom';

import type { ConcentrationAlert, ExposureSnapshot } from '@idemand/common';
import { ServerDataGrid } from 'components';
import { dollarFormat, formatFirestoreTimestamp } from 'modules/utils';

const MIN_TAB_HEIGHT = 40;

const alertCols: GridColDef<ConcentrationAlert>[] = [
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: ({ value }) => {
      const color =
        value === 'active'
          ? 'error'
          : value === 'acknowledged'
            ? 'warning'
            : 'default';
      return <Chip label={value} color={color} size='small' />;
    },
  },
  {
    field: 'alertType',
    headerName: 'Type',
    width: 180,
    valueFormatter: ({ value }) =>
      value === 'absolute_tiv' ? 'Absolute TIV' : 'Week-over-Week Shift',
  },
  { field: 'state', headerName: 'State', width: 80 },
  { field: 'floodZone', headerName: 'Flood Zone', width: 100 },
  { field: 'countyFips', headerName: 'County FIPS', width: 120 },
  {
    field: 'currentTiv',
    headerName: 'Current TIV',
    width: 140,
    type: 'number',
    valueFormatter: ({ value }) => dollarFormat(value),
  },
  {
    field: 'thresholdTiv',
    headerName: 'Threshold TIV',
    width: 140,
    type: 'number',
    valueFormatter: ({ value }) => (value != null ? dollarFormat(value) : '—'),
  },
  {
    field: 'previousTiv',
    headerName: 'Previous TIV',
    width: 140,
    type: 'number',
    valueFormatter: ({ value }) => (value != null ? dollarFormat(value) : '—'),
  },
  {
    field: 'shiftPct',
    headerName: 'Shift %',
    width: 100,
    type: 'number',
    valueFormatter: ({ value }) =>
      value != null ? `${(value * 100).toFixed(1)}%` : '—',
  },
  {
    field: 'detectedAt',
    headerName: 'Detected',
    width: 160,
    valueFormatter: ({ value }) => formatFirestoreTimestamp(value),
  },
];

const snapshotCols: GridColDef<ExposureSnapshot>[] = [
  { field: 'snapshotDate', headerName: 'Date', width: 120 },
  {
    field: 'totalInsuredValue',
    headerName: 'Total TIV',
    width: 150,
    type: 'number',
    valueFormatter: ({ value }) => dollarFormat(value),
  },
  {
    field: 'totalTermPremium',
    headerName: 'Total Premium',
    width: 150,
    type: 'number',
    valueFormatter: ({ value }) => dollarFormat(value),
  },
  {
    field: 'totalLocationCount',
    headerName: 'Locations',
    width: 110,
    type: 'number',
    valueFormatter: ({ value }) => value?.toLocaleString(),
  },
  {
    field: 'bucketCount',
    headerName: 'Buckets',
    width: 100,
    type: 'number',
  },
  {
    field: 'computedAt',
    headerName: 'Computed',
    width: 160,
    valueFormatter: ({ value }) => formatFirestoreTimestamp(value),
  },
  { field: 'computedBy', headerName: 'Triggered By', flex: 1, minWidth: 200 },
];

export const Exposure = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabValue = searchParams.get('tab') || 'alerts';

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setSearchParams({ tab: newValue });
  };

  return (
    <TabContext value={tabValue}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <TabList
          onChange={handleChange}
          aria-label='exposure tabs'
          sx={{
            minHeight: MIN_TAB_HEIGHT,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              minHeight: MIN_TAB_HEIGHT,
              p: 2,
            },
          }}
        >
          <Tab label='Alerts' value='alerts' />
          <Tab label='History' value='history' />
        </TabList>
      </Box>

      <TabPanel value='alerts' sx={{ px: 0 }}>
        <ServerDataGrid<ConcentrationAlert>
          colName='portfolioConcentrationAlerts'
          columns={alertCols}
          density='compact'
          autoHeight
          initialState={{
            sorting: { sortModel: [{ field: 'detectedAt', sort: 'desc' }] },
            columns: {
              columnVisibilityModel: { countyFips: false, geohashPrefix: false },
            },
          }}
        />
      </TabPanel>

      <TabPanel value='history' sx={{ px: 0 }}>
        <ServerDataGrid<ExposureSnapshot>
          colName='portfolioExposure'
          pathSegments={['history', 'snapshots']}
          columns={snapshotCols}
          density='compact'
          autoHeight
          initialState={{
            sorting: { sortModel: [{ field: 'snapshotDate', sort: 'desc' }] },
          }}
        />
      </TabPanel>
    </TabContext>
  );
};
