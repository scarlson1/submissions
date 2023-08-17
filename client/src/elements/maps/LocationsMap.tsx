import { useEffect, useState } from 'react';
import {
  FlyToInterpolator,
  IconLayer,
  IconLayerProps,
  MapViewState,
  PickingInfo,
  WebMercatorViewport,
} from 'deck.gl/typed';
import { useTheme } from '@mui/material';

import { DeckMap, DeckMapProps } from './DeckMap';
import { svgToDataURL, getPlaceMarker, getBoundingBox, CoordObj } from 'modules/utils';

export interface LocationsMapProps extends Omit<DeckMapProps, 'layers' | 'hoverInfo'> {
  data: CoordObj[];
  layerProps?: Omit<IconLayerProps, 'data' | 'id' | 'getSize' | 'onHover'>;
}

export const LocationsMap = ({ data, layerProps, ...props }: LocationsMapProps) => {
  const theme = useTheme();
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();
  const [mapViewState, setMapViewState] = useState<MapViewState>({
    longitude: -94.25,
    latitude: 38.25,
    zoom: 3.5,
    maxZoom: 16,
    minZoom: 3,
  });

  useEffect(() => {
    if (!data.length) return;
    // alternatively: use bbox from turf and useRef.current.fitBounds with duration: 1000 in config
    // https://github.com/visgl/react-map-gl/blob/7.1-release/examples/zoom-to-bounds/src/app.tsx
    // TODO: check if prev equal to current --> ignore
    const coordsArr = data.map((d) => [d.coordinates.longitude, d.coordinates.latitude]);
    const [minLng, minLat, maxLng, maxLat] = getBoundingBox(coordsArr);

    if (
      typeof minLng === 'number' &&
      typeof minLat === 'number' &&
      typeof maxLng === 'number' &&
      typeof maxLat === 'number'
    ) {
      // https://stackoverflow.com/a/63577542
      const viewport = new WebMercatorViewport({ height: 500, width: window.innerWidth });
      const { longitude, latitude, zoom } = viewport.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        {
          padding: 80,
        }
      );

      setMapViewState((prev) => ({
        ...prev,
        latitude,
        longitude,
        zoom,
        transitionDuration: 2000,
        transitionInterpolator: new FlyToInterpolator(),
      }));
    }
  }, [data]);

  return (
    <DeckMap
      mapViewState={mapViewState}
      hoverInfo={hoverInfo}
      layers={[
        new IconLayer({
          id: 'locations-layer',
          data: data || [],
          getIcon: () => ({
            url: svgToDataURL(`${getPlaceMarker(theme.palette.primary.main)}`),
            width: 36,
            height: 36,
            anchorX: 18,
            anchorY: 36,
          }),
          getPosition: (d: CoordObj) => [
            d?.coordinates?.longitude || 0,
            d?.coordinates?.latitude || 0,
          ],
          sizeScale: 1,
          getSize: (d) => 36,
          onHover: (info) => setHoverInfo(info),
          updateTriggers: {
            getIcon: [theme.palette.mode],
          },
          ...(layerProps || {}),
        }),
      ]}
      {...props}
    />
  );
};
