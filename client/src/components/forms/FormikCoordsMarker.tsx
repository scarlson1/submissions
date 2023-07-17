import { useCallback, useEffect, useState } from 'react';
import { useFormikContext } from 'formik';
import { toast } from 'react-hot-toast';
import { MapProps, Marker, MarkerDragEvent, NavigationControl, Map, useMap } from 'react-map-gl';
import { GpsFixedRounded } from '@mui/icons-material';
import 'mapbox-gl/dist/mapbox-gl.css';

import { AddressStepValues } from 'elements/AddressStep';
import { MAPBOX_STREETS, MapStyleControl } from 'components/MapStyleControl';
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
      <GpsFixedRounded color='primary' />
    </Marker>
  );
};

interface FormikCoordsMapProps extends Omit<MapProps, 'initialViewState' | 'mapStyle'> {
  cb?: (coords: { lat: number | null; lng: number | null }, state?: string) => void;
  mapStyle?: string;
}

export const FormikCoordsMap = ({
  cb,
  children,
  mapStyle = MAPBOX_STREETS,
  ...props
}: FormikCoordsMapProps) => {
  const { values } = useFormikContext<AddressStepValues>();
  const [viewState, setViewState] = useState<MapProps['initialViewState']>({
    longitude: values.coordinates?.longitude || -94.25,
    latitude: values.coordinates?.latitude || 38.25,
    zoom: values.coordinates?.latitude && values.coordinates?.longitude ? 16 : 2.5,
  });

  return (
    // @ts-ignore
    <Map
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle={mapStyle}
      styleDiffing
      minZoom={2}
      maxZoom={20}
      scrollZoom={true}
      doubleClickZoom={true}
      {...props}
    >
      <FormikCoordsMarker />
      <NavigationControl />
      <MapStyleControl initStyle={mapStyle as string} color='standard' sx={{ m: 2 }} />
    </Map>
  );
};
