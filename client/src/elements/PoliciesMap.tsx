import React, { useCallback, useMemo, useState } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  NativeSelect,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import { QueryConstraint, where } from 'firebase/firestore';

import { DeckMap } from './DeckMap';
import { useCollectionData } from 'hooks';
import { IconLayer, PickingInfo } from 'deck.gl/typed';

const stateOptions = ['MN', 'FL', 'TN'];

// INTERACT WITH PICKING METHODS DIRECTLY: https://deck.gl/docs/developer-guide/interactivity#calling-the-picking-engine-directly

//  TODO: checkout data filter extension: https://deck.gl/docs/api-reference/extensions/data-filter-extension

// TODO: SWITCH TO POLICIES

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

interface PoliciesMapProps {
  queryConstraints?: QueryConstraint[];
  initState?: string[] | undefined;
  initOrgId?: string | null | undefined;
}

export const PoliciesMap: React.FC<PoliciesMapProps> = ({
  queryConstraints,
  initState = [],
  initOrgId,
}) => {
  // DATA / QUERY STATE
  const [state, setState] = useState<string[] | null | undefined>([...initState]);
  const [orgId, setOrgId] = useState<string | null | undefined>(initOrgId);
  const filters = useMemo(() => {
    let filters = [];
    if (queryConstraints) filters.push(...queryConstraints);
    if (state && state.length > 0) filters.push(where('state', '==', state));
    if (orgId) filters.push(where('orgId', '==', orgId));

    console.log('FILTERS: ', filters);

    return filters;
  }, [state, orgId, queryConstraints]);
  const { data: submissionData } = useCollectionData('SUBMISSIONS', filters, { idField: 'id' });

  // MAP STATE
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();
  const [selected, setSelected] = useState<any[]>([]);

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

  return (
    <Box>
      <Box sx={{ height: 500, width: '100%', borderRadius: 1 }}>
        <DeckMap
          hoverInfo={hoverInfo}
          renderTooltipContent={(info: PickingInfo) => (
            <Box sx={{ px: 2, borderRadius: 0.5 }}>
              <Typography variant='body2' fontWeight='fontWeightMedium'>
                {info.object.addressLine1 || ''}
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
              >{`ID: ${info.object.id}`}</Typography>
            </Box>
          )}
          // getTooltip={({ object }) => object && `${object.addressLine1}\nID: ${object.id}`}
          layers={[
            new IconLayer({
              // ...defaultGeoJsonLayerProps,
              id: `policy-locations-layer`, // @ts-ignore
              data: submissionData, // COUNTIES_URL,
              pickable: true,
              // iconAtlas and iconMapping are required
              // getIcon: return a string
              iconAtlas:
                'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
              iconMapping: ICON_MAPPING,
              getPosition: (d) => [d.coordinates.longitude, d.coordinates.latitude],
              getIcon: (d) => 'marker',
              sizeScale: 5,
              getSize: (d) => 5,
              getColor: (f: any) =>
                selected.length && !!selected.find((s) => s.id === f.id)
                  ? [255, 125, 125] // [0, 125, 255, 150]
                  : [255, 255, 255, 150],
              onHover: (info) => setHoverInfo(info),
              onClick: (info) => handleClicked(info),
              updateTriggers: {
                getColor: [selected],
              },
            }),
          ]}
          // layers={[
          //   new HeatmapLayer({
          //     // ...defaultGeoJsonLayerProps,
          //     id: `policy-locations-layer`, // @ts-ignore
          //     // data: countiesData,
          //     // data: countiesURL,
          //     data: submissionData, // COUNTIES_URL,
          //     getPosition: (d) => [d.coordinates.longitude, d.coordinates.latitude], // d.COORDINATES,
          //     radiusPixels: 25,
          //   }),
          // ]}
        />
      </Box>
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
            {/* <option value='MN'>MN</option>
            <option value='FL'>FL</option> */}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ py: 5 }}>
        <Typography variant='h6' sx={{ py: 2 }}>
          Selected
        </Typography>
        {selected.map((s) => (
          <Typography variant='body2' key={s.id}>{`${s.addressLine1} (ID: ${s.id})`}</Typography>
        ))}
      </Box>
    </Box>
  );
};
