import { Box, Card, Grid2Props, Typography, useTheme } from '@mui/material';
import { useFormikContext } from 'formik';
import { ErrorBoundary } from 'react-error-boundary';

import { MAPBOX_DARK, MAPBOX_LIGHT, usePreferredMapStyle } from 'components';
import { FormikCoordsMap } from 'components/forms/FormikCoordsMarker';
import { FormikAddress, FormikAddressProps } from 'elements/forms';
import { AddressStepValues } from './AddressStep';

export interface AddressStepTestProps extends Omit<FormikAddressProps, 'setFieldValue'> {
  gridProps?: Grid2Props;
}

export const AddressStepQuote = ({ gridProps, ...props }: AddressStepTestProps) => {
  const theme = useTheme();
  const [mapStyle] = usePreferredMapStyle(
    theme.palette.mode === 'dark' ? MAPBOX_DARK : MAPBOX_LIGHT
  );
  const { values } = useFormikContext<AddressStepValues>();

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
          <FormikCoordsMap scrollZoom={false} mapStyle={mapStyle || MAPBOX_LIGHT} />
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
