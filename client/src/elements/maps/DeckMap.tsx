import DeckGL, { DeckGLProps } from '@deck.gl/react/typed';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { LayersList, MapViewState, PickingInfo } from 'deck.gl/typed';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReactNode } from 'react';
import Map from 'react-map-gl';

import { DEFAULT_INITIAL_VIEW_STATE } from './constants';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// TODO: pass HoverInfo as child ?? needs to be direct descendant of DeckGl ??

export interface DeckMapProps extends Partial<DeckGLProps> {
  mapViewState?: MapViewState;
  layers?: LayersList | undefined;
  hoverInfo?: PickingInfo | null | undefined;
  renderTooltipContent?: (info: PickingInfo) => ReactNode;
  children?: React.ReactNode;
}

export const DeckMap = ({
  mapViewState = DEFAULT_INITIAL_VIEW_STATE,
  layers,
  hoverInfo,
  renderTooltipContent,
  children,
  ...rest
}: DeckMapProps) => {
  const theme = useTheme();

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <DeckGL
        initialViewState={mapViewState}
        controller={true}
        layers={layers}
        width='100%'
        height='100%'
        style={{ position: 'relative' }}
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
          // @ts-ignore
          projection='mercator'
        >
          {children}
        </Map>
        <HoverInfo pickingInfo={hoverInfo} renderTooltipContent={renderTooltipContent} />
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

export function HoverInfo({ pickingInfo, renderTooltipContent, children }: HoverInfoProps) {
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
