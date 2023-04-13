import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { QueryConstraint } from 'firebase/firestore';

import { DeckMap } from './DeckMap';
import { useCollectionData } from 'hooks';
import { IconLayer, PickingInfo } from 'deck.gl/typed';

// TODO: SWITCH TO POLICIES

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

interface PoliciesMapProps {
  queryConstraints?: QueryConstraint[];
}

export const PoliciesMap: React.FC<PoliciesMapProps> = ({ queryConstraints }) => {
  // TODO:  query constraints
  const { data: submissionData } = useCollectionData('SUBMISSIONS', queryConstraints);
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();

  console.log('DATA: ', submissionData);

  return (
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
            sizeScale: 10,
            getSize: (d) => 5,
            getColor: (d) => [Math.sqrt(d.exits), 140, 0],
            onHover: (info) => setHoverInfo(info),
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
  );
};
