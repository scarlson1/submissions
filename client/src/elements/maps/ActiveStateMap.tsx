import { GeoJsonLayer } from '@deck.gl/layers/typed';
import { CancelRounded, CheckCircleRounded } from '@mui/icons-material';
import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { PickingInfo } from 'deck.gl/typed';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useState } from 'react';

import { STATES_URL } from 'common';
import { DeckMap, DeckMapProps, defaultGeoJsonLayerProps } from 'elements';
import { DEFAULT_INITIAL_VIEW_STATE } from './constants';

// TODO: create generalized component (use with counties)
// TODO: use zustand ? or recoil or kotai for shared state between switch and map?

const INITIAL_VIEW_STATE = {
  ...DEFAULT_INITIAL_VIEW_STATE,
  maxZoom: 16,
};

export interface ActiveStateMapProps extends DeckMapProps {
  handleClick?: (pickingInfo: PickingInfo, event: any) => void;
  statesValues: { [key: string]: boolean } | undefined;
}

export const ActiveStateMap = ({
  handleClick,
  statesValues,
  initialViewState = INITIAL_VIEW_STATE,
  children,
  ...props
}: ActiveStateMapProps) => {
  const theme = useTheme();
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();

  return (
    <DeckMap
      // mapViewState={mapViewState}
      initialViewState={initialViewState}
      hoverInfo={hoverInfo}
      renderTooltipContent={(info: PickingInfo) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {info.object.properties?.NAME || ''}
          {statesValues && !!statesValues[info.object?.properties?.SHORT_NAME] ? (
            <CheckCircleRounded color='success' fontSize='small' sx={{ ml: 1.5 }} />
          ) : (
            <CancelRounded color='error' fontSize='small' sx={{ ml: 1.5 }} />
          )}
        </Box>
      )}
      {...props}
      layers={[
        ...(props?.layers || []),
        new GeoJsonLayer({
          ...defaultGeoJsonLayerProps,
          id: `geojson-layer-states`,
          data: STATES_URL,
          highlightColor: theme.palette.mode === 'dark' ? [255, 255, 255, 25] : [80, 144, 211, 20],
          getLineColor: theme.palette.mode === 'dark' ? [255, 255, 255, 200] : [178, 186, 194, 200],
          getFillColor: (f) =>
            statesValues && !!statesValues[f.properties?.SHORT_NAME]
              ? [0, 125, 255, 50]
              : [255, 255, 255, 20],
          onHover: (info) => setHoverInfo(info),
          onClick: handleClick,
          updateTriggers: {
            getFillColor: [statesValues],
          },
        }),
      ]}
    >
      {children}
    </DeckMap>
  );
};
