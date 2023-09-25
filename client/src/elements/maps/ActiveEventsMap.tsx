import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  Link,
  Typography,
  useTheme,
  Unstable_Grid2 as Grid,
} from '@mui/material';
import { GeoJsonLayer, PickingInfo } from 'deck.gl/typed';
import { format } from 'date-fns';
import { OpenInNewRounded } from '@mui/icons-material';

import { DeckMap } from './DeckMap';
import { getRGBAArray } from 'modules/utils';

// available filters: https://www.weather.gov/documentation/services-web-api#/default/alerts_active

const floodEventTypes = [
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

// TODO: query controls - event type, status, area (state), etc.
// use react-query to fetch data (mutation)
// https://tkdodo.eu/blog/leveraging-the-query-function-context#how-to-type-the-queryfunctioncontext

// export const useActiveEventsRQ = () => {
//   const [params] = useState({
//     // , setParams
//     event: floodEventTypes,
//     status: ['actual', 'exercise', 'system', 'test'],
//   });

//   return useQuery({
//     queryKey: ['activeEvents', params.status, params.event],
//     queryFn: async ({queryKey}) => {
//       // const response = await fetch('')
//       const response = await axios.get(`https://api.weather.gov/alerts/active`, {params: {
//         status: queryKey[1],
//         event: queryKey[2]
//       }});
//       return response.data
//     }
//   })
// }

const useActiveEvents = () => {
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);

  // TODO: pass params to getData --> add to query
  // can only pass one of the following: area, point, region, region_type, zone (forecast or county)
  // area: State/territory code
  // severity: Extreme, Severe, Moderate, Minor, Unknown
  const getData = useCallback(async (params: Record<string, any> = {}) => {
    // eventTypes?: string[]
    try {
      setLoading(true);
      const { data: res } = await axios.get(`https://api.weather.gov/alerts/active`, {
        // ?area=FL
        params,
      });
      console.log('DATA: ', res);

      setData(res);
    } catch (err: any) {
      console.log('Error: ', err);
    }
    setLoading(false);
  }, []);

  return useMemo(() => ({ data, loading, getData }), [data, loading, getData]);
};
// TODO: dynamic queries (type of event, location (state, county, policy locations, etc.))
// zoom to bounds once data loaded ?? or query ??
export const ActiveEventsMap = () => {
  const theme = useTheme();
  const { getData, data } = useActiveEvents();
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>(); // TODO: type properties
  // TODO: use useReducer instead ??
  // Use deck.gl filter extension ??
  const [params] = useState({
    // , setParams
    event: floodEventTypes,
    status: ['actual', 'exercise', 'system', 'test'],
  });

  const getEventColor = useCallback(
    (e: any) => {
      console.log('event: ', e); // TODO: color by type of event

      return getRGBAArray(theme.palette.primary.main, 180);
    },
    [theme]
  );

  if (!data)
    return (
      <Button
        onClick={
          () => getData(params)
          // getData({ event: floodEventTypes, status: ['actual', 'exercise', 'system', 'test'] })
        }
      >
        Get Data
      </Button>
    );

  return (
    <Box>
      <Grid container spacing={3}>
        {/* TODO: query select (useReducer ?? react-query ?? useInfiniteQuery ??) requires telling layer when to update - dependency prop ?? */}
        <Grid>
          <Typography>TODO: query filters</Typography>
        </Grid>
        <Grid>
          <Button
            onClick={() =>
              getData({ event: floodEventTypes, status: ['actual', 'exercise', 'system', 'test'] })
            }
          >
            Get Data
          </Button>
        </Grid>
      </Grid>

      {/* <Card> */}
      <Card sx={{ height: { xs: 360, sm: 400, lg: 500 }, width: '100%' }}>
        <DeckMap
          layers={[
            new GeoJsonLayer({
              id: 'geojson-layer',
              data: data,
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
      {/* </Card> */}
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
