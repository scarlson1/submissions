import DeckGL, { DeckGLProps } from '@deck.gl/react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LayersList, PickingInfo } from 'deck.gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReactNode } from 'react';
import Map from 'react-map-gl';

import { useWidth } from 'hooks';
import { DEFAULT_INITIAL_VIEW_STATE, MAPBOX_TOKEN } from './constants';

// TODO: pass HoverInfo as child ?? needs to be direct descendant of DeckGl ??

// ONLY SUPPLY ONE OF viewState or initialViewState

export interface DeckMapProps extends Partial<DeckGLProps> {
  // mapViewState?: MapViewState;
  layers?: LayersList | undefined;
  hoverInfo?: PickingInfo | null | undefined;
  renderTooltipContent?: (info: PickingInfo) => ReactNode;
  children?: React.ReactNode;
}

export const DeckMap = ({
  initialViewState = DEFAULT_INITIAL_VIEW_STATE, // TODO: remove default if using viewState (don't pass both)
  // mapViewState = DEFAULT_INITIAL_VIEW_STATE,
  layers,
  hoverInfo,
  renderTooltipContent,
  children,
  ...rest
}: DeckMapProps) => {
  const theme = useTheme();
  const { isMobile } = useWidth();

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <DeckGL
        initialViewState={initialViewState}
        controller={true}
        layers={layers}
        width='100%'
        height='100%'
        style={{ position: 'relative' }}
        eventRecognizerOptions={
          isMobile
            ? {
                pan: { threshold: 10 },
                tap: { threshold: 5 },
              }
            : {}
        }
        {...rest}
      >
        <Map
          mapboxAccessToken={MAPBOX_TOKEN}
          mapStyle={
            theme.palette.mode === 'light'
              ? 'mapbox://styles/mapbox/light-v11' // 8
              : 'mapbox://styles/spencer-carlson/clkrsmyib01wz01qwdbujb4da'
          }
          styleDiffing
          minZoom={2}
          maxZoom={20}
          maxPitch={85}
          // react-map-gl bug - uses globe view instead of defaulting to mercator
          projection={{ name: 'mercator' }}
        >
          {children}
        </Map>
        <HoverInfo
          pickingInfo={hoverInfo}
          renderTooltipContent={renderTooltipContent}
        />
      </DeckGL>
    </Box>
  );
};

// TODO: if component is being used --> move to file
interface HoverInfoProps {
  pickingInfo?: PickingInfo | null | undefined;
  renderTooltipContent?: (info: PickingInfo) => ReactNode;
  children?: ReactNode;
}

export function HoverInfo({
  pickingInfo,
  renderTooltipContent,
  children,
}: HoverInfoProps) {
  if (!(pickingInfo && pickingInfo.object)) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        zIndex: 2000,
        pointerEvents: 'none',
        left: pickingInfo.x,
        top: pickingInfo.y,
        backgroundColor: 'background.paper',
        px: 2,
        py: 1.5,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <Typography variant='body2' component='div'>
        {renderTooltipContent
          ? renderTooltipContent(pickingInfo)
          : pickingInfo.object.properties?.NAME || ''}
      </Typography>
      {children}
    </Box>
  );
}
