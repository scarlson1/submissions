import {
  Box,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Typography,
  useTheme,
} from '@mui/material';
import { IconLayer, IconLayerProps, MapViewState, PickingInfo } from 'deck.gl/typed';
import { QueryConstraint, where } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
// import { DataFilterExtension } from '@deck.gl/extensions';

import { Submission, WithId } from 'common';
import { useCollectionData, useFlyToBounds } from 'hooks';
import {
  CoordObj,
  TypedPickingInfo,
  getPlaceMarker,
  getRGBAArray,
  svgToDataURL,
} from 'modules/utils';
import { DeckMap } from './DeckMap';
import { DEFAULT_INITIAL_VIEW_STATE } from './constants';
import { renderSubmissionTooltip } from './renderTooltips';

// TODO: study how MUI 'slots' works to create component that can add filters, etc.

const stateOptions = ['MN', 'FL', 'TN'];

//  TODO: checkout data filter extension: https://deck.gl/docs/api-reference/extensions/data-filter-extension

// TODO: draw layers using nebula: https://github.com/uber/nebula.gl/blob/master/modules/edit-modes/src/lib/draw-circle-from-center-mode.ts

// TODO: pull filters, etc. up to parent component and pass as prop ??

interface SubmissionsMapProps {
  constraints?: QueryConstraint[];
  layerProps?: Omit<Partial<IconLayerProps>, 'getSize' | 'onHover'>;
}

export const SubmissionsMap = ({ constraints = [], layerProps }: SubmissionsMapProps) => {
  const theme = useTheme();
  const [mapViewState, setMapViewState] = useState<MapViewState>(DEFAULT_INITIAL_VIEW_STATE);
  const { data: submissionData } = useCollectionData<Submission>('submissions', constraints, {
    idField: 'id',
  });
  const [hoverInfo, setHoverInfo] = useState<TypedPickingInfo<WithId<Submission>>>();
  const flyToBounds = useFlyToBounds(submissionData, setMapViewState, 2000);
  const mapLoaded = useRef(false);

  useEffect(() => {
    mapLoaded.current && flyToBounds();
  }, [flyToBounds]);

  const layers = [
    new IconLayer({
      id: `submissions-layer`,
      data: submissionData,
      pickable: true,
      getIcon: (d: CoordObj) => ({
        url: svgToDataURL(`${getPlaceMarker(theme.palette.primary.main)}`),
        width: 36,
        height: 36,
        anchorX: 18,
        anchorY: 36,
      }),
      getPosition: (d: any) => [d.coordinates?.longitude || 0, d.coordinates?.latitude || 0],
      sizeScale: 5,
      getSize: (d) => 5,
      onHover: (info) => setHoverInfo(info),
      visible: true,
      updateTriggers: {
        getIcon: [theme.palette.mode],
      },
      ...(layerProps || {}),
    }),
  ];

  return (
    <DeckMap
      layers={layers}
      initialViewState={mapViewState}
      hoverInfo={hoverInfo}
      renderTooltipContent={renderSubmissionTooltip}
      onLoad={() => {
        flyToBounds();
        mapLoaded.current = true;
      }}
    />
  );
};

interface TestSubmissionsMapProps {
  queryConstraints?: QueryConstraint[];
  initState?: string[] | undefined;
  initOrgId?: string | null | undefined;
}

export const TestSubmissionsMapWithFilters = ({
  queryConstraints,
  initState = [],
}: TestSubmissionsMapProps) => {
  const theme = useTheme();
  const [state, setState] = useState<string[] | null | undefined>([...initState]);

  const filters = useMemo(() => {
    let filters = [];
    if (queryConstraints) filters.push(...queryConstraints);
    if (state && state.length > 0) filters.push(where('state', '==', state));
    // if (orgId) filters.push(where('orgId', '==', orgId));

    // console.log('FILTERS: ', filters);

    return filters;
  }, [state, queryConstraints]);

  const [selected, setSelected] = useState<WithId<Submission>[]>([]); // TODO: just store ID ? not all policy json
  // PASS TO GPU FILTER EXTENSION
  // const [dateRange, setDateRange] = useState<number[]>([
  //   new Date('04/01/2023').getTime() / 1000,
  //   Date.now() / 1000,
  // ]);
  const handleClicked = useCallback(
    (info: PickingInfo) => {
      let newId = info.object?.id;
      if (!newId) return;

      if (selected.some((s) => s.id === newId)) {
        const newSelected = selected.filter((s) => s.id !== newId);

        setSelected(newSelected);
      } else {
        setSelected((s) => [...(s || []), info.object]);
      }
    },
    [selected]
  );

  const handleStateChange = (event: SelectChangeEvent<typeof state>) => {
    const {
      target: { value },
    } = event;
    setState(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  const pinColor = useMemo(
    () => getRGBAArray(theme.palette.primary.main, 150),
    [theme.palette.primary.main]
  );

  return (
    <Box>
      <Card sx={{ height: { xs: 300, sm: 400, md: 460, lg: 500 }, width: '100%' }}>
        <SubmissionsMap
          constraints={filters}
          layerProps={{
            getColor: (f: any) =>
              selected.length && !!selected.find((s) => s.id === f.id) ? [255, 125, 125] : pinColor,
            onClick: (info) => handleClicked(info),
            updateTriggers: {
              getColor: [selected, pinColor],
            },
            // WORKS
            // getFilterValue: (d: Policy) => d.metadata?.created.seconds,
            // filterRange: dateRange, // [0, 1],
            // extensions: [new DataFilterExtension({ filterSize: 1 })],
          }}
        />
      </Card>

      <Box>
        <FormControl sx={{ m: 1, width: 200 }}>
          <InputLabel id='state-filter'>State</InputLabel>
          <Select
            value={state}
            onChange={handleStateChange}
            multiple
            input={<OutlinedInput label='State' />}
            // MenuProps={MenuProps}
          >
            {stateOptions.map((s) => (
              <MenuItem
                key={s}
                value={s}
                // style={getStyles(name, personName, theme)}
              >
                {s}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ py: 5 }}>
        <Typography variant='h6' sx={{ py: 2 }}>
          Selected
        </Typography>
        {selected.map((s) => (
          <Typography
            variant='body2'
            key={s.id}
            onClick={() => handleClicked({ object: { id: s.id } } as PickingInfo)}
            sx={{ '&:hover': { cursor: 'pointer' } }}
          >{`${s.address?.addressLine1 || ''} (ID: ${s.id})`}</Typography>
        ))}
      </Box>
    </Box>
  );
};
