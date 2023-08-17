import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { QueryConstraint, where } from 'firebase/firestore';
import { IconLayer, IconLayerProps, PickingInfo } from 'deck.gl/typed';
// import { DataFilterExtension } from '@deck.gl/extensions';

import { DeckMap, HoverInfo } from './DeckMap';
import { useCollectionData } from 'hooks';
import { Submission, WithId } from 'common';
import { MAP_ICON_URL, ICON_MAPPING, getRGBAArray, TypedPickingInfo } from 'modules/utils';

// TODO: study how MUI 'slots' works to create component that can add filters, etc.
// TODO: use useReducer to create actions for map ?? (and context ??)

const stateOptions = ['MN', 'FL', 'TN'];

//  TODO: checkout data filter extension: https://deck.gl/docs/api-reference/extensions/data-filter-extension

// TODO: draw layers using nebula: https://github.com/uber/nebula.gl/blob/master/modules/edit-modes/src/lib/draw-circle-from-center-mode.ts

// TODO: SWITCH TO POLICIES
// TODO: pull filters, etc. up to parent component and pass as prop ??

interface PoliciesMapProps {
  constraints?: QueryConstraint[];
  layerProps?: Omit<Partial<IconLayerProps>, 'getSize' | 'onHover'>;
  // initState?: string[] | undefined;
  // initOrgId?: string | null | undefined;
}

export const PoliciesMap = ({ constraints = [], layerProps }: PoliciesMapProps) => {
  const { data: submissionData } = useCollectionData('SUBMISSIONS', constraints, { idField: 'id' });
  useEffect(() => {
    console.log('DATA: ', submissionData);
  }, [submissionData]);

  // MAP STATE
  const [hoverInfo, setHoverInfo] = useState<TypedPickingInfo<WithId<Submission>>>();

  const layers = [
    new IconLayer({
      // ...defaultGeoJsonLayerProps,
      id: `policy-locations-layer`,
      data: submissionData,
      pickable: true,
      // getIcon: return a string alternative to iconAtlas/Mapping (different icons per data point)
      iconAtlas: MAP_ICON_URL,
      iconMapping: ICON_MAPPING,
      getPosition: (d: any) => [d.coordinates.longitude, d.coordinates.latitude],
      getIcon: (d) => 'marker',
      sizeScale: 5,
      getSize: (d) => 5,
      onHover: (info) => setHoverInfo(info),
      visible: true,
      ...(layerProps || {}),
    }),
  ];

  return (
    <DeckMap layers={layers}>
      <HoverInfo
        pickingInfo={hoverInfo}
        renderTooltipContent={(info: TypedPickingInfo<WithId<Submission>>) => {
          console.log('pick: ', info);
          return (
            <Box sx={{ px: 2, borderRadius: 0.5 }}>
              <Typography variant='body2' fontWeight='fontWeightMedium'>
                {info.object?.address.addressLine1 || ''}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
              >{`ID: ${info.object?.id}`}</Typography>
            </Box>
          );
        }}
      />
    </DeckMap>
  );
};

interface TestPoliciesMapProps {
  queryConstraints?: QueryConstraint[];
  initState?: string[] | undefined;
  initOrgId?: string | null | undefined;
}

export const TestPoliciesMapWithFilters = ({
  queryConstraints,
  initState = [],
}: TestPoliciesMapProps) => {
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
        <PoliciesMap
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
          >{`${s.address.addressLine1} (ID: ${s.id})`}</Typography>
        ))}
      </Box>
    </Box>
  );
};
