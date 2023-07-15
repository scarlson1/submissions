import { useCallback, useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { toast } from 'react-hot-toast';
import { Marker, MarkerDragEvent, useMap } from 'react-map-gl';
import { GpsFixedRounded } from '@mui/icons-material';

import { AddressStepValues } from 'elements/AddressStep';
// popup example https://github.com/visgl/react-map-gl/blob/7.1-release/examples/controls/src/app.tsx

interface FormikCoordsMarkerProps {
  cb?: (coords: { lat: number; lng: number }) => void;
}

export const FormikCoordsMarker = ({ cb }: FormikCoordsMarkerProps) => {
  const { current: map } = useMap();
  const { values, setFieldValue } = useFormikContext<AddressStepValues>();

  const [marker, setMarker] = useState({
    latitude: values.coordinates?.latitude || null,
    longitude: values.coordinates?.longitude || null,
  });

  useEffect(() => {
    console.log('marker coords: ', values.coordinates);
  }, [values.coordinates]);

  const onMarkerDrag = useCallback((event: MarkerDragEvent) => {
    setMarker({
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
    });
  }, []);

  const onMarkerDragEnd = useCallback(
    (event: MarkerDragEvent) => {
      setFieldValue('coordinates.longitude', event.lngLat.lng);
      setFieldValue('coordinates.latitude', event.lngLat.lat);
      map?.flyTo({ center: event.lngLat });

      toast.success(`coordinates updated!`, { position: 'top-right', duration: 2000 });
      if (cb) cb({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    },
    [cb, setFieldValue, map]
  );

  if (!(marker?.latitude && marker?.longitude)) return null;

  return (
    <Marker
      latitude={marker.latitude}
      longitude={marker.longitude}
      draggable={true}
      onDrag={onMarkerDrag}
      onDragEnd={onMarkerDragEnd}
      anchor='center'
      style={{ height: '26px', width: '26px' }} // default marker: height of 41px and a width of 27px
    >
      <GpsFixedRounded />
    </Marker>
  );
};

// <Marker
//   latitude={36.040088594038394}
//   longitude={-86.90773510282183}
//   style={{ border: `1px solid black` }}
// >
//   <GpsNotFixedRounded color='error' fontSize='small' />
// </Marker>;
