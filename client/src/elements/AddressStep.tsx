import React, { useState, useCallback } from 'react';
import { Card, Grid2Props, Typography } from '@mui/material';
import { useFormikContext } from 'formik';
import { FlyToInterpolator, MapViewState } from '@deck.gl/core/typed';
import { Marker } from 'react-map-gl';
import { toast } from 'react-hot-toast';
import 'mapbox-gl/dist/mapbox-gl.css';

import { FormikAddress } from 'elements';
import { useRegisterEmailNotification } from 'hooks';
import { ActiveStateMap } from './ActiveStateMap';

export interface AddressStepValues {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postal: string;
  latitude: number | null;
  longitude: number | null;
}

export interface AddressStepProps {
  activeStates?: { [key: string]: boolean };
  shouldValidateStates?: boolean;
  withMap?: boolean;
  gridProps?: Grid2Props;
}

// TODO: state and postal validation
// TODO: load by product /flood/new - get active states from /state/:productId in db

export const AddressStep: React.FC<AddressStepProps> = ({
  activeStates = {},
  shouldValidateStates = false,
  withMap = true,
  gridProps,
}) => {
  const { values, setFieldValue, validateForm } = useFormikContext<AddressStepValues>();
  const [showMarker, setShowMarker] = useState(Boolean(values.latitude && values.longitude));
  const [mapViewState, setMapViewState] = useState<MapViewState>({
    latitude: values.latitude || 37.25,
    longitude: values.longitude || -94.75,
    zoom: values.latitude && values.longitude ? 15 : 2.5,
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
      autocompleteTextFieldProps={{
        helperText: values.addressLine1 ? (
          <Typography
            variant='subtitle2'
            color='text.primary'
            component='span'
          >{`Current value: ${values.addressLine1}`}</Typography>
        ) : undefined,
      }}
      gridProps={gridProps}
    >
      {!!withMap && (
        <>
          <Card sx={{ height: 280, width: '100%', mt: 5 }}>
            <ActiveStateMap
              handleClick={(i, e) => {}}
              statesValues={activeStates}
              mapViewState={mapViewState}
            >
              {showMarker && values.latitude && values.longitude && (
                <Marker
                  longitude={values.longitude}
                  latitude={values.latitude}
                  anchor='bottom'
                ></Marker>
              )}
            </ActiveStateMap>
          </Card>

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

// {
//   values.latitude && values.longitude && (
//     <Collapse in={mapOpen} unmountOnExit>
//       <Card sx={{ height: 240, width: '100%', mt: 5 }}>
//         <Map
//           initialViewState={{
//             longitude: values.longitude,
//             latitude: values.latitude,
//             zoom: 13,
//           }}
//           mapStyle={
//             theme.palette.mode === 'light'
//               ? 'mapbox://styles/mapbox/light-v8'
//               : 'mapbox://styles/spencer-carlson/cl8dxgtum000w14qix5ft9gw5'
//           }
//         >
//           <Marker longitude={values.longitude} latitude={values.latitude} anchor='center' />
//         </Map>
//       </Card>
//     </Collapse>
//   );
// }
