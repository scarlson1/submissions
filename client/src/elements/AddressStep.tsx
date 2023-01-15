import React, { useState } from 'react';
import { Collapse, Card } from '@mui/material';
import { useFormikContext } from 'formik';
import Map, { Marker } from 'react-map-gl';
import { useTheme } from '@mui/material/styles';
import 'mapbox-gl/dist/mapbox-gl.css';

// import { FloodFormValues } from './Flood';
import { FormikAddress } from 'elements';

export interface AddressStepValues {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postal: string;
  latitude: number | null;
  longitude: number | null;
}

// TODO: create reusable deckGL map and simpler react-map
// TODO: collapse map on select
// TODO: state and postal validation

export const AddressStep: React.FC = () => {
  const theme = useTheme();
  const { values, setFieldValue, validateForm } = useFormikContext<AddressStepValues>();
  const [mapOpen, setMapOpen] = useState(false);

  const addressChangeCb = async (values?: any) => {
    setMapOpen(true);

    setTimeout(async () => {
      await validateForm();
    }, 100);
  };

  return (
    <FormikAddress setFieldValue={setFieldValue} cb={addressChangeCb}>
      {values.latitude && values.longitude && (
        <Collapse in={mapOpen} unmountOnExit>
          <Card sx={{ height: 240, width: '100%', mt: 5 }}>
            <Map
              initialViewState={{
                longitude: values.longitude,
                latitude: values.latitude,
                zoom: 13,
              }}
              mapStyle={
                theme.palette.mode === 'light'
                  ? 'mapbox://styles/mapbox/light-v8'
                  : 'mapbox://styles/spencer-carlson/cl8dxgtum000w14qix5ft9gw5' // 'mapbox://styles/mapbox/dark-v10'
              }
            >
              <Marker longitude={values.longitude} latitude={values.latitude} anchor='center' />
            </Map>
          </Card>
        </Collapse>
      )}
    </FormikAddress>
  );
};

export default AddressStep;
