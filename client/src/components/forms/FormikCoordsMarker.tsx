import { GpsFixedRounded } from '@mui/icons-material';
import { useFormikContext } from 'formik';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Map, MapProps, Marker, MarkerDragEvent, NavigationControl, useMap } from 'react-map-gl';

import {
  DEFAULT_MAP_STYLE_OPTIONS,
  MAPBOX_STREETS,
  MOBILE_DEFAULT_MAP_STYLE_OPTIONS,
  MapStyleControl,
} from 'components/MapStyleControl';
import { AddressStepValues } from 'elements/forms/AddressStep';
import { useWidth } from 'hooks';
// popup example https://github.com/visgl/react-map-gl/blob/7.1-release/examples/controls/src/app.tsx

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

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
    const latitude = values.coordinates.latitude;
    const longitude = values.coordinates.longitude;
    setMarker({
      latitude: latitude || null,
      longitude: longitude || null,
    });
    if (latitude && longitude)
      map?.flyTo({ center: [longitude, latitude], zoom: 16, duration: 2000 });
  }, [values.coordinates, map]);

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

      toast.success(`coordinates updated!`, { position: 'top-right', duration: 2000 });
      if (cb) cb({ lat: event.lngLat.lat, lng: event.lngLat.lng });
    },
    [cb, setFieldValue]
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
      style={{ height: '24px', width: '24px' }} // default marker: height of 41px and a width of 27px
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
  const { isSmall } = useWidth();

  const mapStyleOptions = useMemo(
    () => (isSmall ? MOBILE_DEFAULT_MAP_STYLE_OPTIONS : DEFAULT_MAP_STYLE_OPTIONS),
    [isSmall]
  );

  return (
    // @ts-ignore
    <Map
      {...viewState}
      mapboxAccessToken={MAPBOX_TOKEN}
      onMove={(evt) => setViewState(evt.viewState)}
      mapStyle={mapStyle}
      styleDiffing
      minZoom={3}
      maxZoom={20}
      maxPitch={85}
      scrollZoom={true}
      doubleClickZoom={true} // @ts-ignore
      projection='mercator'
      {...props}
    >
      <FormikCoordsMarker />
      <NavigationControl />
      <MapStyleControl
        options={mapStyleOptions}
        initStyle={mapStyle as string}
        color='standard'
        sx={{ m: 2 }}
      />
    </Map>
  );
};
