import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  Link,
  Typography,
  useTheme,
  // Unstable_Grid2 as Grid,
  SelectChangeEvent,
  FormControl,
  InputLabel,
  Select,
  OutlinedInput,
  MenuItem,
  Checkbox,
  ListItemText,
  Stack,
  SelectProps,
  CircularProgress,
} from '@mui/material';
import { GeoJsonLayer, IconLayer, PickingInfo } from 'deck.gl/typed';
import { format } from 'date-fns';
import { OpenInNewRounded } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';

import { DeckMap } from './DeckMap';
import { CoordObj, getPlaceMarker, getRGBAArray, svgToDataURL } from 'modules/utils';
import { queryClient } from 'modules/queryClient';
import { STATES_ABV_ARR } from 'common/statesList';
import { useCollectionData } from 'hooks';

// available filters: https://www.weather.gov/documentation/services-web-api#/default/alerts_active

const FEMA_EVENT_TYPE_OPTIONS = [
  //   '911 Telephone Outage Emergency',
  //   'Administrative Message',
  //   'Air Quality Alert',
  //   'Air Stagnation Advisory',
  //   'Arroyo And Small Stream Flood Advisory',
  //   'Ashfall Advisory',
  //   'Ashfall Warning',
  //   'Avalanche Advisory',
  //   'Avalanche Warning',
  //   'Avalanche Watch',
  //   'Beach Hazards Statement',
  //   'Blizzard Warning',
  //   'Blizzard Watch',
  //   'Blowing Dust Advisory',
  //   'Blowing Dust Warning',
  //   'Brisk Wind Advisory',
  //   'Child Abduction Emergency',
  //   'Civil Danger Warning',
  //   'Civil Emergency Message',
  'Coastal Flood Advisory',
  //   'Coastal Flood Statement',
  'Coastal Flood Warning',
  'Coastal Flood Watch',
  //   'Dense Fog Advisory',
  //   'Dense Smoke Advisory',
  //   'Dust Advisory',
  //   'Dust Storm Warning',
  //   'Earthquake Warning',
  //   'Evacuation - Immediate',
  //   'Excessive Heat Warning',
  //   'Excessive Heat Watch',
  //   'Extreme Cold Warning',
  //   'Extreme Cold Watch',
  //   'Extreme Fire Danger',
  //   'Extreme Wind Warning',
  //   'Fire Warning',
  //   'Fire Weather Watch',
  'Flash Flood Statement',
  'Flash Flood Warning',
  'Flash Flood Watch',
  'Flood Advisory',
  //   'Flood Statement',
  'Flood Warning',
  'Flood Watch',
  //   'Freeze Warning',
  //   'Freeze Watch',
  //   'Freezing Fog Advisory',
  //   'Freezing Rain Advisory',
  //   'Freezing Spray Advisory',
  //   'Frost Advisory',
  //   'Gale Warning',
  //   'Gale Watch',
  //   'Hard Freeze Warning',
  //   'Hard Freeze Watch',
  //   'Hazardous Materials Warning',
  //   'Hazardous Seas Warning',
  //   'Hazardous Seas Watch',
  //   'Hazardous Weather Outlook',
  //   'Heat Advisory',
  //   'Heavy Freezing Spray Warning',
  //   'Heavy Freezing Spray Watch',
  //   'High Surf Advisory',
  //   'High Surf Warning',
  'High Wind Warning',
  'High Wind Watch',
  'Hurricane Force Wind Warning',
  'Hurricane Force Wind Watch',
  //   'Hurricane Local Statement',
  'Hurricane Warning',
  'Hurricane Watch',
  //   'Hydrologic Advisory',
  //   'Hydrologic Outlook',
  //   'Ice Storm Warning',
  //   'Lake Effect Snow Advisory',
  //   'Lake Effect Snow Warning',
  //   'Lake Effect Snow Watch',
  //   'Lake Wind Advisory',
  'Lakeshore Flood Advisory',
  //   'Lakeshore Flood Statement',
  'Lakeshore Flood Warning',
  'Lakeshore Flood Watch',
  //   'Law Enforcement Warning',
  //   'Local Area Emergency',
  //   'Low Water Advisory',
  //   'Marine Weather Statement',
  //   'Nuclear Power Plant Warning',
  //   'Radiological Hazard Warning',
  //   'Red Flag Warning',
  //   'Rip Current Statement',
  //   'Severe Thunderstorm Warning',
  //   'Severe Thunderstorm Watch',
  //   'Severe Weather Statement',
  //   'Shelter In Place Warning',
  //   'Short Term Forecast',
  //   'Small Craft Advisory',
  //   'Small Craft Advisory For Hazardous Seas',
  //   'Small Craft Advisory For Rough Bar',
  //   'Small Craft Advisory For Winds',
  //   'Small Stream Flood Advisory',
  //   'Snow Squall Warning',
  //   'Special Marine Warning',
  //   'Special Weather Statement',
  'Storm Surge Warning',
  'Storm Surge Watch',
  //   'Storm Warning',
  //   'Storm Watch',
  //   'Test',
  //   'Tornado Warning',
  //   'Tornado Watch',
  //   'Tropical Depression Local Statement',
  // 'Tropical Storm Local Statement',
  'Tropical Storm Warning',
  'Tropical Storm Watch',
  'Tsunami Advisory',
  'Tsunami Warning',
  'Tsunami Watch',
  //   'Typhoon Local Statement',
  'Typhoon Warning',
  'Typhoon Watch',
  //   'Urban And Small Stream Flood Advisory',
  //   'Volcano Warning',
  //   'Wind Advisory',
  //   'Wind Chill Advisory',
  //   'Wind Chill Warning',
  //   'Wind Chill Watch',
  //   'Winter Storm Warning',
  //   'Winter Storm Watch',
  //   'Winter Weather Advisory',
];

const EVENT_STATUS_OPTIONS = ['actual', 'exercise', 'system', 'test'];

// TODO: query controls - event type, status, area (state), etc.
// https://tkdodo.eu/blog/leveraging-the-query-function-context#how-to-type-the-queryfunctioncontext

interface ActiveEventsParams {
  event: string[];
  status: string[];
  area?: string[];
}

// query options: https://www.weather.gov/documentation/services-web-api#/default/alerts_query
export const useActiveEvents = (params: ActiveEventsParams) =>
  useQuery({
    // ...(options || {}),
    queryKey: ['activeEvents', params.status, params.event, params.area],
    queryFn: async ({ queryKey }) => {
      // let params: Record<string, any> = {};
      // if (queryKey[1]) params['status'] = queryKey[1];
      // if (queryKey[2]) params['event'] = queryKey[2];
      // if (queryKey[3] && queryKey[3] !== 'all') params['area'] = queryKey[3];
      const response = await axios.get(`https://api.weather.gov/alerts/active`, {
        // params,
        params: {
          status: queryKey[1],
          event: queryKey[2],
          area: queryKey[3],
        },
      });
      return response.data;
    },
    initialData: () => {
      const allEvents = queryClient.getQueryData<any>(['activeEvents', FEMA_EVENT_TYPE_OPTIONS]);
      // const filteredData = allTodos?.filter((todo) => todo.state === state) ?? [];
      // TODO: handle filter initialData by event type
      const filteredData = allEvents ?? []; // ?.filter((todo) => todo.state === state) ?? [];

      return filteredData.length > 0 ? filteredData : undefined;
    },
    suspense: false,
  });

// TODO: dynamic queries (type of event, location (state, county, policy locations, etc.))
// zoom to bounds once data loaded ?? or query ??
export const ActiveEventsMap = () => {
  const theme = useTheme();
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>(); // TODO: type properties
  // Use deck.gl filter extension ??
  const [params, setParams] = useState<ActiveEventsParams>({
    event: FEMA_EVENT_TYPE_OPTIONS,
    status: ['actual'], // EVENT_STATUS_OPTIONS,
    area: [],
    // severity: ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown']
    // urgency: ['Immediate', 'Expected', 'Future', 'Past', 'Unknown']
  });
  const { data, isFetching, isError, error } = useActiveEvents(params);

  const { data: locationData } = useCollectionData('LOCATIONS', [], {
    idField: 'id',
    suspense: false,
    initialData: [],
  });

  useEffect(() => {
    console.log('RQ Data: ', data);
  }, [data]);

  const getEventColor = useCallback(
    (e: any) => {
      // console.log('event: ', e); // TODO: color by type of event
      return getRGBAArray(theme.palette.primary.main, 180);
    },
    [theme]
  );

  const handleFilterChange = useCallback(
    (key: keyof ActiveEventsParams) => (event: SelectChangeEvent<string[] | string>) => {
      const {
        target: { value },
      } = event;

      const valArr = typeof value === 'string' ? value.split(',') : value;

      setParams((prev) => ({
        ...prev,
        [key]: valArr,
      }));
    },
    []
  );

  if (isError)
    return (
      <Typography align='center' component='div' color='text.secondary'>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </Typography>
    );

  return (
    <Box>
      <Stack spacing={3} direction={{ sm: 'column', md: 'row' }}>
        <MultipleSelect
          label='Event Type'
          value={params.event}
          handleChange={handleFilterChange('event')}
          id='event'
          options={FEMA_EVENT_TYPE_OPTIONS}
        />
        <MultipleSelect
          label='State'
          value={params.area || []}
          handleChange={handleFilterChange('area')}
          id='area'
          options={STATES_ABV_ARR}
        />
        <MultipleSelect
          label='Mode'
          value={params.status}
          handleChange={handleFilterChange('status')}
          id='status'
          options={EVENT_STATUS_OPTIONS}
        />
      </Stack>

      <Card sx={{ height: { xs: 360, sm: 400, lg: 500 }, width: '100%', position: 'relative' }}>
        {isFetching && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        <DeckMap
          layers={[
            new GeoJsonLayer({
              id: 'geojson-layer',
              data: data || {},
              // data: 'https://api.weather.gov/alerts/active', // ?area=FL
              pickable: true,
              stroked: false,
              filled: true,
              extruded: true,
              pointType: 'circle',
              lineWidthScale: 20,
              lineWidthMinPixels: 2,
              getFillColor: getEventColor,
              // getFillColor: [0, 125, 255, 50], // [160, 160, 180, 200],
              // getLineColor: d => colorToRGBArray(d.properties.color),
              getPointRadius: 100,
              getLineWidth: 1,
              getElevation: 30,
              onHover: (info) => setHoverInfo(info),
            }),
            new IconLayer({
              id: 'locations-layer',
              data: locationData,
              getIcon: (d: CoordObj) => ({
                url: svgToDataURL(
                  `${getPlaceMarker(
                    d.cancelEffDate ? theme.palette.primaryDark.main : theme.palette.primary.main
                  )}`
                ),
                width: 36,
                height: 36,
                anchorX: 18,
                anchorY: 36,
              }),
              getPosition: (d: CoordObj) => [
                d?.coordinates?.longitude || 0,
                d?.coordinates?.latitude || 0,
              ],
              sizeScale: 1,
              getSize: (d) => 36,
              onHover: (info) => setHoverInfo(info),
              updateTriggers: {
                getIcon: [theme.palette.mode],
              },
              // ...(layerProps || {}),
            }),
          ]}
          hoverInfo={hoverInfo}
          renderTooltipContent={(info: PickingInfo) => (
            <Box sx={{ px: 2, borderRadius: 0.5, zIndex: 2000 }}>
              <Typography variant='body2' fontWeight='fontWeightMedium'>
                {info.object?.properties?.event || ''}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {info.object?.properties?.areaDesc || ''}
              </Typography>
              {info.object?.properties?.effective ? (
                <Typography variant='body2' color='text.secondary'>
                  Effective:{' '}
                  {format(new Date(info.object?.properties?.effective), 'MM/dd/yyyy h a')}
                </Typography>
              ) : null}
              {info.object && info.object?.properties?.status !== 'Actual' ? (
                <Typography
                  variant='body2'
                  color='warning.main'
                  fontWeight='fontWeightMedium'
                >{`Status: ${info.object?.properties?.status}`}</Typography>
              ) : null}
            </Box>
          )}
        >
          {/* BUG: tooltip renders under layers when passed as child to "Map" (vs. child of DeckGL) - cause = mapRef issue ?? */}
          {/* <HoverInfo
            pickingInfo={hoverInfo}
            renderTooltipContent={(info: PickingInfo) => {
              // console.log('pick: ', info);
              return (
                <Box sx={{ px: 2, borderRadius: 0.5, zIndex: 2000 }}>
                  <Typography variant='body2' fontWeight='fontWeightMedium'>
                    {info.object?.properties?.event || ''}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {info.object?.properties?.areaDesc || ''}
                  </Typography>
                  {info.object?.properties?.effective ? (
                    <Typography variant='body2' color='text.secondary'>
                      Effective:{' '}
                      {format(new Date(info.object?.properties?.effective), 'MM/dd/yyyy h a')}
                    </Typography>
                  ) : null}
                  {info.object && info.object?.properties?.status !== 'Actual' ? (
                    <Typography
                      variant='body2'
                      color='warning.main'
                      fontWeight='fontWeightMedium'
                    >{`Status: ${info.object?.properties?.status}`}</Typography>
                  ) : null}
                </Box>
              );
            }}
          /> */}
        </DeckMap>
      </Card>
      <Typography variant='subtitle2' color='text.secondary' sx={{ py: 1.5, px: 2 }}>
        Live events from{' '}
        <Link
          href='https://www.weather.gov/documentation/services-web-api#/'
          underline='hover'
          target='_blank'
          rel='noopener'
        >
          weather.gov <OpenInNewRounded fontSize='small' color='inherit' />
        </Link>
      </Typography>
    </Box>
  );
};

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

interface MultipleSelectProps {
  options: string[];
  handleChange: SelectProps<string[]>['onChange'];
  value: string[];
  id: string;
  label: string;
}

export function MultipleSelect({ handleChange, value, id, label, options }: MultipleSelectProps) {
  return (
    <div>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id={`multiple-checkbox-label-${id}`}>{label}</InputLabel>
        <Select
          labelId={`multiple-checkbox-label-${id}`}
          id={id}
          multiple
          value={value}
          onChange={handleChange}
          input={<OutlinedInput label={label} />}
          renderValue={(selected) => value.join(', ')}
          MenuProps={MenuProps}
        >
          {options.map((o) => (
            <MenuItem key={o} value={o}>
              <Checkbox checked={value.indexOf(o) > -1} />
              <ListItemText primary={o} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </div>
  );
}
