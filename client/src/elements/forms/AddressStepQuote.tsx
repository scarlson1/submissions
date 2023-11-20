import { MapboxOverlay, MapboxOverlayProps } from '@deck.gl/mapbox/typed';
import { Box, Card, Grid2Props, Typography, useTheme } from '@mui/material';
import { GeoJsonLayer } from 'deck.gl/typed';
import { useFormikContext } from 'formik';
import { ErrorBoundary } from 'react-error-boundary';
import { useControl } from 'react-map-gl';

import { ActiveStates, STATES_URL } from 'common';
import { MAPBOX_DARK, MAPBOX_LIGHT, usePreferredMapStyle } from 'components';
import { FormikCoordsMap } from 'components/forms/FormikCoordsMarker';
import { defaultGeoJsonLayerProps } from 'elements';
import { FormikAddress, FormikAddressProps } from 'elements/forms';
import { useDocData } from 'hooks';
import { AddressStepValues } from './AddressStep';

function DeckGLOverlay(
  props: MapboxOverlayProps & {
    interleaved?: boolean;
  }
) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}
export interface AddressStepTestProps extends Omit<FormikAddressProps, 'setFieldValue'> {
  gridProps?: Grid2Props;
}

export const AddressStepQuote = ({ gridProps, ...props }: AddressStepTestProps) => {
  const theme = useTheme();
  const [mapStyle] = usePreferredMapStyle(
    theme.palette.mode === 'dark' ? MAPBOX_DARK : MAPBOX_LIGHT
  );
  const { values } = useFormikContext<AddressStepValues>();

  // const [hoverInfo, setHoverInfo] = useState<PickingInfo>();
  const { data: activeStates } = useDocData<ActiveStates>('states', 'flood');

  const activeStatesLayer = new GeoJsonLayer({
    ...defaultGeoJsonLayerProps,
    id: `geojson-layer-states`,
    data: STATES_URL,
    highlightColor: theme.palette.mode === 'dark' ? [255, 255, 255, 25] : [80, 144, 211, 20],
    getLineColor: theme.palette.mode === 'dark' ? [255, 255, 255, 200] : [178, 186, 194, 200],
    getFillColor: (f) =>
      activeStates && !!activeStates[f.properties?.SHORT_NAME as keyof ActiveStates]
        ? [0, 125, 255, 50]
        : [255, 255, 255, 20],
    // onHover: (info) => setHoverInfo(info),
    // onClick: handleClick,
    updateTriggers: {
      getFillColor: [activeStates],
    },
  });

  return (
    <>
      <FormikAddress gridProps={gridProps} {...props} />
      <Card sx={{ height: 280, width: '100%', mt: 5 }}>
        <ErrorBoundary
          FallbackComponent={() => (
            <Typography color='text.secondary' variant='subtitle2' align='center' sx={{ py: 5 }}>
              Error loading map
            </Typography>
          )}
        >
          <FormikCoordsMap scrollZoom={false} mapStyle={mapStyle || MAPBOX_LIGHT}>
            <DeckGLOverlay layers={[activeStatesLayer]} />
          </FormikCoordsMap>
        </ErrorBoundary>
      </Card>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Typography
          variant='body2'
          color='text.secondary'
          sx={{ ml: 2, mt: 1, fontSize: '0.725rem' }}
        >
          Drag pin to edit coordinates. Zoom in for accuracy.
        </Typography>
        {values.coordinates?.latitude && values.coordinates.longitude ? (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ mx: 2, mt: 1, fontSize: '0.725rem' }}
          >
            {`[${values.coordinates?.latitude}, ${values.coordinates.longitude}]`}
          </Typography>
        ) : null}
      </Box>
    </>
  );
};
