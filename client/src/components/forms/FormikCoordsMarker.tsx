import { useCallback, useState } from 'react';
import { useFormikContext } from 'formik';
import { toast } from 'react-hot-toast';
import { Marker, MarkerDragEvent, useMap } from 'react-map-gl';

import { AddressStepValues } from 'elements/AddressStep';

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

  // TODO: offset anchor https://github.com/visgl/react-map-gl/issues/585#issuecomment-421033354
  return (
    <>
      <Marker
        latitude={marker.latitude}
        longitude={marker.longitude}
        draggable={true}
        onDrag={onMarkerDrag}
        onDragEnd={onMarkerDragEnd}
        anchor='bottom'
        style={{ border: `1px solid red` }}
      ></Marker>
      <Marker
        latitude={marker.latitude}
        longitude={marker.longitude}
        // draggable={true}
        // onDrag={onMarkerDrag}
        // onDragEnd={onMarkerDragEnd}
        // anchor='bottom'
        anchor='center'
        style={{ border: `1px solid red` }}
      ></Marker>
      <Marker
        latitude={marker.latitude}
        longitude={marker.longitude}
        anchor='top'
        style={{ border: `1px solid red` }}
      ></Marker>
    </>
  );
};
