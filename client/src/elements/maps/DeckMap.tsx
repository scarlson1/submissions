import DeckGL, { DeckGLProps } from '@deck.gl/react/typed';
import { Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { GeoJsonLayerProps, LayersList, MapViewState, PickingInfo } from 'deck.gl/typed';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ReactNode } from 'react';
import Map from 'react-map-gl';

export const DEFAULT_INITIAL_VIEW_STATE = {
  longitude: -94.25,
  latitude: 38.25,
  zoom: 3.5,
  maxZoom: 18,
  minZoom: 3,
  pitch: 0,
  bearing: 0,
};

export const defaultGeoJsonLayerProps: Partial<GeoJsonLayerProps> = {
  pickable: true,
  stroked: true,
  filled: true,
  extruded: true,
  lineWidthScale: 20,
  lineWidthMinPixels: 2,
  autoHighlight: true,
  wireframe: true,
  highlightColor: [80, 144, 211, 20],
  getLineColor: [178, 186, 194, 200],
  getFillColor: [255, 255, 255, 20],
  getPointRadius: 100,
  getLineWidth: 10,
};

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
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
          mapStyle={
            theme.palette.mode === 'light'
              ? 'mapbox://styles/mapbox/light-v11' // 8
              : 'mapbox://styles/spencer-carlson/clkrsmyib01wz01qwdbujb4da'
          }
          styleDiffing
          minZoom={2}
          maxZoom={20}
          maxPitch={85}
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
