import { Box, Typography } from '@mui/material';
import Map from 'react-map-gl';
import DeckGL, { DeckGLProps } from '@deck.gl/react/typed';
import { GeoJsonLayerProps, LayersList, MapViewState, PickingInfo } from 'deck.gl/typed';

import { useTheme } from '@mui/material/styles';
import 'mapbox-gl/dist/mapbox-gl.css';

const INITIAL_VIEW_STATE = {
  longitude: -94.25,
  latitude: 38.25,
  zoom: 3.5,
  maxZoom: 16,
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

export interface DeckMapProps extends Partial<DeckGLProps> {
  mapViewState?: MapViewState;
  layers?: LayersList | undefined;
  hoverInfo?: PickingInfo | null | undefined;
  renderTooltipContent?: (info: PickingInfo) => React.ReactNode;
  children?: React.ReactNode;
}

export const DeckMap = ({
  mapViewState = INITIAL_VIEW_STATE,
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
          mapStyle={
            theme.palette.mode === 'light'
              ? 'mapbox://styles/mapbox/light-v8'
              : 'mapbox://styles/spencer-carlson/cl8dxgtum000w14qix5ft9gw5'
          }
          styleDiffing
          minZoom={2}
          maxZoom={20}
        >
          {children}
        </Map>
        {hoverInfo && hoverInfo.object && (
          <Box
            sx={{
              position: 'absolute',
              // zIndex: 1,
              zIndex: 2000,
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
            <Typography variant='body2' component='div'>
              {renderTooltipContent
                ? renderTooltipContent(hoverInfo)
                : hoverInfo.object.properties?.NAME || ''}
            </Typography>
          </Box>
        )}
      </DeckGL>
    </Box>
  );
};
