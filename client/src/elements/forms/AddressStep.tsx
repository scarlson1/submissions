import { useState, useCallback, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Card, CircularProgress, Grid2Props, Typography } from '@mui/material';
import { useFormikContext } from 'formik';
import { FlyToInterpolator, MapViewState } from '@deck.gl/core/typed';
import { Marker } from 'react-map-gl';
import { toast } from 'react-hot-toast';
import 'mapbox-gl/dist/mapbox-gl.css';

import { FormikAddress, FormikAddressProps } from './FormikAddress';
import { useRegisterEmailNotification } from 'hooks';
import { ActiveStateMap } from '../ActiveStateMap';
import { Address, Coordinates, Nullable } from 'common';

export interface AddressStepValues {
  address: Address;
  coordinates: Nullable<Coordinates>;
}

export interface AddressStepProps extends Omit<FormikAddressProps, 'setFieldValue'> {
  activeStates?: { [key: string]: boolean };
  shouldValidateStates?: boolean;
  withMap?: boolean;
  gridProps?: Grid2Props;
}

// TODO: state and postal validation
// TODO: load by product /flood/new - get active states from /state/:productId in db
// TODO: emial lists in email service (sendgrid)

// TODO: pass map as child ??

export const AddressStep = ({
  activeStates = {},
  shouldValidateStates = false,
  withMap = true,
  gridProps,
  ...props
}: AddressStepProps) => {
  const { values, setFieldValue, validateForm } = useFormikContext<AddressStepValues>();
  const [showMarker, setShowMarker] = useState(
    Boolean(values.coordinates?.latitude && values.coordinates?.longitude)
  );
  const [mapViewState, setMapViewState] = useState<MapViewState>({
    latitude: values.coordinates?.latitude || 37.25,
    longitude: values.coordinates?.longitude || -94.75,
    zoom: values.coordinates?.latitude && values.coordinates?.longitude ? 15 : 2.5,
    maxZoom: 16,
    minZoom: 2,
    bearing: 0,
    pitch: 0,
  });
  const { registerEmailDialog, handleUnavailableState } = useRegisterEmailNotification({
    onSuccess: () => toast.success(`Thanks! We'll be in touch`),
    onError: console.log,
  });

  const flyToCoords = useCallback(
    ({ lat, lng }: { lat: number | null; lng: number | null }) => {
      if (!lat || !lng) return;
      setMapViewState({
        ...mapViewState,
        latitude: lat,
        longitude: lng,
        zoom: 15,
        pitch: 0,
        bearing: 0,
        transitionDuration: 2000,
        transitionInterpolator: new FlyToInterpolator(),
      });

      setTimeout(() => {
        setShowMarker(true);
      }, 2300);
    },
    [mapViewState]
  );

  const addressChangeCb = useCallback(
    async (coords: { lat: number | null; lng: number | null }, state?: string) => {
      if (withMap) flyToCoords(coords);

      setTimeout(async () => {
        await validateForm();
      }, 100);

      if (!!shouldValidateStates && state && activeStates && !activeStates[state]) {
        await handleUnavailableState(state);
      }
    },
    [flyToCoords, validateForm, handleUnavailableState, withMap, shouldValidateStates, activeStates]
  );

  const handleNotificationRegistry = useCallback(async () => {
    await registerEmailDialog();
  }, [registerEmailDialog]);

  return (
    <FormikAddress
      setFieldValue={setFieldValue}
      cb={addressChangeCb}
      // replaced with 'autocompleteProps.textFieldProps'
      // autocompleteTextFieldProps={{
      //   helperText: values.address?.addressLine1 ? (
      //     <Typography
      //       variant='subtitle2'
      //       color='text.primary'
      //       component='span'
      //     >{`Current value: ${values.address?.addressLine1}`}</Typography>
      //   ) : undefined,
      // }}
      gridProps={gridProps}
      {...props}
    >
      {!!withMap && (
        <>
          <Card sx={{ height: 280, width: '100%', mt: 5 }}>
            <ErrorBoundary
              FallbackComponent={() => <Typography>Error loading active states</Typography>}
            >
              <Suspense fallback={<CircularProgress />}>
                <ActiveStateMap
                  handleClick={(i, e) => {}}
                  statesValues={activeStates}
                  mapViewState={mapViewState}
                  controller={{ scrollZoom: false, touchZoom: true }}
                >
                  {showMarker && values.coordinates?.latitude && values.coordinates?.longitude && (
                    <Marker
                      longitude={values.coordinates?.longitude}
                      latitude={values.coordinates?.latitude}
                      anchor='bottom'
                    ></Marker>
                  )}
                </ActiveStateMap>
              </Suspense>
            </ErrorBoundary>
          </Card>

          {/* TODO: move within error boundary ?? */}
          <Typography
            variant='caption'
            color='text.secondary'
            sx={{
              pl: 4,
              py: 1,
              // visibility: values.latitude && values.longitude ? 'hidden' : 'visible',
            }}
          >
            Currently available states.{' '}
            <Typography
              component='span'
              variant='caption'
              color='text.secondary'
              fontWeight='fontWeightMedium'
              sx={{ '&:hover': { textDecoration: 'underline', cursor: 'pointer' } }}
              onClick={handleNotificationRegistry}
            >
              Leave your email
            </Typography>{' '}
            to be notified when your state joins the list.
          </Typography>
        </>
      )}
    </FormikAddress>
  );
};

export default AddressStep;
