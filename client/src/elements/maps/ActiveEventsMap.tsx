import { CloseRounded, OpenInNewRounded } from '@mui/icons-material';
import {
  Box,
  Card,
  Checkbox,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  Link,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  SelectProps,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios, { AxiosRequestConfig } from 'axios';
import { Color, GeoJsonLayer, IconLayer, PickingInfo } from 'deck.gl';
import { Timestamp, where } from 'firebase/firestore';
import { useCallback, useState } from 'react';

import { State } from '@idemand/common';
import { useCollectionData } from 'hooks';
import {
  CoordObj,
  getPlaceMarker,
  getRGBAArray,
  stringToColor,
  svgToDataURL,
} from 'modules/utils';
import { DeckMap } from './DeckMap';
import { renderEventTooltip, renderLocationTooltip } from './renderTooltips';

// TODO: use example below to add "click" icon --> show details
// hover info deck.gl example: https://github.com/visgl/deck.gl/blob/8.9-release/examples/website/icon/app.jsx
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

const EVENT_STATUS_OPTIONS = ['actual', 'exercise', 'system', 'test', 'draft'];
const FEMA_SEVERITY_OPTIONS = [
  'Extreme',
  'Severe',
  'Moderate',
  'Minor',
  'Unknown',
];
const FEMA_URGENCY_OPTIONS = [
  'Immediate',
  'Expected',
  'Future',
  'Past',
  'Unknown',
];

const LAYER_IDS = {
  events: 'events-layer',
  locations: 'locations-layer',
};

const colorCache: Record<string, Color> = {};
const currentTS = Timestamp.now();

// TODO: use deck.gl filter extension ??
// https://tkdodo.eu/blog/leveraging-the-query-function-context#how-to-type-the-queryfunctioncontext
// query options: https://www.weather.gov/documentation/services-web-api#/default/alerts_query

interface ActiveEventsParams {
  event: string[];
  status: string[];
  area?: string[];
  severity?: string[];
  urgency?: string[];
}

async function fetchActiveEvents(
  params: AxiosRequestConfig<ActiveEventsParams>['params'],
) {
  const { data } = await axios.get(`https://api.weather.gov/alerts/active`, {
    params,
  });
  return data;
}

// TODO: move to it's own file
export const useActiveEvents = (filters: ActiveEventsParams) =>
  useQuery({
    queryKey: ['activeEvents', { ...filters }],
    queryFn: async ({ queryKey }) => fetchActiveEvents(queryKey[1]),
    // initialData: { type: 'FeatureCollection', features: [] },
    // suspense: false,
  });

// zoom to bounds once data loaded ?? or query ??
// TODO: compute # locations count / list overlapping with each type of storm event type (render different color marker ??)
export const ActiveEventsMap = () => {
  const theme = useTheme();
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>(); // TODO: type FeatureCollection properties
  const [params, setParams] = useState<ActiveEventsParams>({
    event: FEMA_EVENT_TYPE_OPTIONS,
    status: ['actual'],
    area: [],
    severity: [],
    urgency: [],
  });
  const {
    data: eventData,
    isLoading,
    isError,
    error,
  } = useActiveEvents(params);

  const { data: locationData } = useCollectionData(
    'locations',
    [
      where('expirationDate', '>=', currentTS),
      where('parentType', '==', 'policy'),
    ],
    {
      idField: 'id',
      suspense: false,
      initialData: [],
    },
  );

  const getEventColor = useCallback(
    (e: any) => {
      const eventType = e?.properties?.event || 'primary';
      let colorArr = colorCache[eventType];
      if (!colorArr) {
        let colorStr = stringToColor(
          e?.properties?.event || theme.palette.primary.main,
        );
        colorArr = getRGBAArray(colorStr, 180);
        colorCache[eventType] = colorArr;
      }

      return colorArr; // getRGBAArray(color, 180);
    },
    [theme],
  );

  const handleFilterChange = useCallback(
    (key: keyof ActiveEventsParams) =>
      (event: SelectChangeEvent<string[] | string>) => {
        const {
          target: { value },
        } = event;

        const valArr = typeof value === 'string' ? value.split(',') : value;

        setParams((prev) => ({
          ...prev,
          [key]: valArr,
        }));
      },
    [],
  );

  const handleClear = useCallback(
    (key: keyof ActiveEventsParams) => () =>
      setParams((prev) => ({
        ...prev,
        [key]: [],
      })),
    [],
  );

  if (isError)
    return (
      <Typography align='center' component='div' color='text.secondary'>
        <pre>{JSON.stringify(error, null, 2)}</pre>
      </Typography>
    );

  // TODO: mobile filter component (drawer or popover ?? or individual icon buttons like grid)
  // TODO: switch to autocomplete instead of select for event filter dropdown
  // TODO: location filters (filter by policy, named insured, etc.)
  // might require rxjs observable to merge policy with locations ??
  // TODO: use deck.gl filter instead of refetching for performance ??

  return (
    <Box>
      <Box sx={{ py: 2 }}>
        <ActiveEventsFilters
          filters={params}
          onChange={handleFilterChange}
          onClear={handleClear}
        />
      </Box>
      <Card
        sx={{
          height: { xs: 360, sm: 400, lg: 500 },
          width: '100%',
          position: 'relative',
        }}
      >
        {isLoading && (
          <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 100 }}>
            <CircularProgress size={20} />
          </Box>
        )}
        <DeckMap
          layers={[
            new GeoJsonLayer({
              id: LAYER_IDS.events,
              data: eventData || { type: 'FeatureCollection', features: [] },
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
              onError: (err) => console.log('Layer error: ', err),
            }),
            new IconLayer({
              id: LAYER_IDS.locations,
              data: locationData,
              getIcon: (d: CoordObj) => ({
                url: svgToDataURL(
                  `${getPlaceMarker(
                    d.cancelEffDate
                      ? theme.palette.primaryDark.main
                      : theme.palette.primary.main,
                  )}`,
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
              pickable: true,
              updateTriggers: {
                getIcon: [theme.palette.mode],
              },
            }),
          ]}
          hoverInfo={hoverInfo}
          renderTooltipContent={renderTooltip}
          // renderTooltipContent={(info: PickingInfo) => (
          //   <Box sx={{ px: 2, borderRadius: 0.5, zIndex: 2000 }}>
          //     <Typography variant='body2' fontWeight='fontWeightMedium'>
          //       {info.object?.properties?.event || ''}
          //     </Typography>
          //     <Typography
          //       variant='body2'
          //       color='text.secondary'
          //       sx={{
          //         maxWidth: 300,
          //         overflowX: 'hidden',
          //         textOverflow: 'ellipsis',
          //         whiteSpace: 'nowrap',
          //       }}
          //     >
          //       {info.object?.properties?.areaDesc || ''}
          //     </Typography>
          //     {info.object?.properties?.effective ? (
          //       <Typography variant='body2' color='text.secondary'>
          //         Effective:{' '}
          //         {format(new Date(info.object?.properties?.effective), 'MM/dd/yyyy h a')}
          //       </Typography>
          //     ) : null}
          //     {info.object && info.object?.properties?.status !== 'Actual' ? (
          //       <Typography
          //         variant='body2'
          //         color='warning.main'
          //         fontWeight='fontWeightMedium'
          //       >{`Status: ${info.object?.properties?.status}`}</Typography>
          //     ) : null}
          //   </Box>
          // )}
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
      <Typography
        variant='subtitle2'
        color='text.secondary'
        sx={{ py: 1.5, px: 2 }}
      >
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

// break into smaller re-usable functions (renderLocationTooltip, etc.)
function renderTooltip(info?: PickingInfo) {
  if (!info) return null;
  let layerId = info?.layer?.id;

  if (layerId === LAYER_IDS.events) return renderEventTooltip(info);

  if (layerId === LAYER_IDS.locations) return renderLocationTooltip(info);

  return null;
}

const ITEM_HEIGHT = 40;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 200,
    },
  },
};

// interface MultipleSelectProps extends SelectProps<string[]> {
//   options: string[];
//   handleChange: SelectProps<string[]>['onChange'];
//   value: string[];
//   label: string;
//   id: string
// }

type MultipleSelectProps = SelectProps<string[]> & {
  options: string[];
  handleChange: SelectProps<string[]>['onChange'];
  value: string[];
  label: string;
  id: string;
};

export function MultipleSelect({
  handleChange,
  value,
  id,
  label,
  options,
  ...props
}: MultipleSelectProps) {
  return (
    <div>
      <FormControl sx={{ m: 1, width: 240 }}>
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
          {...props}
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

interface ActiveEventsFiltersProps {
  filters: ActiveEventsParams;
  onChange: (
    key: keyof ActiveEventsParams,
  ) => (event: SelectChangeEvent<string[] | string>) => void;
  onClear: (key: keyof ActiveEventsParams) => () => void;
}

function ActiveEventsFilters({
  filters,
  onChange,
  onClear,
}: ActiveEventsFiltersProps) {
  return (
    <Stack spacing={3} direction={{ sm: 'column', md: 'row' }}>
      <MultipleSelect
        label='Event Type'
        value={filters.event}
        handleChange={onChange('event')}
        id='event'
        options={FEMA_EVENT_TYPE_OPTIONS}
        endAdornment={
          <IconButton
            sx={{ display: filters.event?.length ? '' : 'none' }}
            onClick={onClear('event')}
            size='small'
          >
            <CloseRounded />
          </IconButton>
        }
      />
      <MultipleSelect
        label='State'
        value={filters.area || []}
        handleChange={onChange('area')}
        id='area'
        options={State.options} // @ts-ignore
        endAdornment={
          <IconButton
            sx={{ display: filters.area?.length ? '' : 'none' }}
            onClick={onClear('area')}
            size='small'
          >
            <CloseRounded />
          </IconButton>
        }
        // not working
        // sx={{
        //   '&.Mui-focused .MuiIconButton-root': {
        //     color: 'primary.main',
        //     display: params.area?.length ? '' : 'none',
        //   },
        // }}
      />
      <MultipleSelect
        label='Mode'
        value={filters.status}
        handleChange={onChange('status')}
        id='status'
        options={EVENT_STATUS_OPTIONS}
      />
      <MultipleSelect
        label='Severity'
        value={filters.severity || []}
        handleChange={onChange('severity')}
        id='severity'
        options={FEMA_SEVERITY_OPTIONS}
      />
      <MultipleSelect
        label='Urgency'
        value={filters.urgency || []}
        handleChange={onChange('urgency')}
        id='urgency'
        options={FEMA_URGENCY_OPTIONS}
      />
    </Stack>
  );
}
