import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';
import { CancelRounded, CheckCircleRounded } from '@mui/icons-material';
import Map from 'react-map-gl';
import DeckGL from '@deck.gl/react/typed';
import { GeoJsonLayer } from '@deck.gl/layers/typed';
import { PickingInfo } from 'deck.gl/typed';

import { useTheme } from '@mui/material/styles';
import 'mapbox-gl/dist/mapbox-gl.css';

import statesData from 'assets/states_20m.json';
// import { STATE_ABBREVIATION } from 'common';

const INITIAL_VIEW_STATE = {
  longitude: -94.25,
  latitude: 38.25,
  zoom: 3.5,
  maxZoom: 16,
  minZoom: 3,
  pitch: 0,
  bearing: 0,
};

export interface TestEditActiveStateMapProps {
  handleClick: (pickingInfo: PickingInfo, event: any) => void;
  statesValues: { [key: string]: boolean } | undefined; // key in STATE_ABBREVIATION
}

export const TestEditActiveStateMap: React.FC<TestEditActiveStateMapProps> = ({
  handleClick,
  statesValues,
}) => {
  const theme = useTheme();
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();

  const currentStateLayer = new GeoJsonLayer({
    id: `geojson-layer`, // @ts-ignore
    data: statesData,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: true,
    lineWidthScale: 20,
    lineWidthMinPixels: 2,
    autoHighlight: true,
    wireframe: true,
    highlightColor: [255, 255, 255, 25],
    getLineColor: [255, 255, 255, 200],
    getFillColor: (f) =>
      statesValues && !!statesValues[f.properties?.SHORT_NAME]
        ? [0, 125, 255, 50]
        : [255, 255, 255, 20],
    getPointRadius: 100,
    getLineWidth: 10,
    onHover: (info) => setHoverInfo(info),
    onClick: handleClick,
    // https://deck.gl/docs/api-reference/core/layer#updatetriggers
    // example:
    // getFillColor: (d) => (d.male ? maleColor : femaleColor),
    updateTriggers: {
      getFillColor: [statesValues],
    },
  });

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        // layers={layers}
        layers={[currentStateLayer]}
        width='100%'
        height='100%'
        style={{ position: 'relative' }}
      >
        <Map
          mapStyle={
            theme.palette.mode === 'light'
              ? 'mapbox://styles/mapbox/light-v8'
              : 'mapbox://styles/spencer-carlson/cl8dxgtum000w14qix5ft9gw5'
          }
          styleDiffing
          minZoom={2}
          maxZoom={20}
        />
        {hoverInfo && hoverInfo.object && (
          <Box
            sx={{
              position: 'absolute',
              zIndex: 1,
              pointerEvents: 'none',
              left: hoverInfo.x,
              top: hoverInfo.y,
              backgroundColor: 'background.paper',
              px: 2,
              py: 1.5,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography variant='body2'>{hoverInfo.object.properties?.NAME || ''}</Typography>
            {statesValues && !!statesValues[hoverInfo.object.properties.SHORT_NAME] ? (
              <CheckCircleRounded color='success' fontSize='small' sx={{ ml: 1.5 }} />
            ) : (
              <CancelRounded color='error' fontSize='small' sx={{ ml: 1.5 }} />
            )}
          </Box>
        )}
      </DeckGL>
    </Box>
  );
};
