import { Card, Grid2Props, Typography, useTheme } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

import { MAPBOX_DARK, MAPBOX_LIGHT, usePreferredMapStyle } from 'components';
import { FormikCoordsMap } from 'components/forms/FormikCoordsMarker';
import { FormikAddress, FormikAddressProps } from 'elements/forms';

export interface AddressStepTestProps extends Omit<FormikAddressProps, 'setFieldValue'> {
  gridProps?: Grid2Props;
}

export const AddressStepQuote = ({ gridProps, ...props }: AddressStepTestProps) => {
  const theme = useTheme();
  const [mapStyle] = usePreferredMapStyle(
    theme.palette.mode === 'dark' ? MAPBOX_DARK : MAPBOX_LIGHT
  );

  return (
    // </FormikAddress>
    (<>
      <FormikAddress gridProps={gridProps} {...props} />
      <Card sx={{ height: 280, width: '100%', mt: 5 }}>
        <ErrorBoundary
          FallbackComponent={() => (
            <Typography color='text.secondary' variant='subtitle2' align='center' sx={{ py: 5 }}>
              Error loading map
            </Typography>
          )}
        >
          <FormikCoordsMap
            scrollZoom={false}
            mapStyle={mapStyle || MAPBOX_LIGHT}
            // mapStyle={theme.palette.mode === 'dark' ? MAPBOX_DARK : MAPBOX_LIGHT}
          />
        </ErrorBoundary>
      </Card>
      <Typography
        variant='body2'
        color='text.secondary'
        sx={{ ml: 2, mt: 1, fontSize: '0.725rem' }}
      >
        Drag pin to edit coordinates. Zoom in for accuracy.
      </Typography>
    </>)
  );
};
