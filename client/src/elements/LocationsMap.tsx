import { useEffect, useState } from 'react';
import { GeoPoint } from 'firebase/firestore';
import {
  FlyToInterpolator,
  IconLayer,
  IconLayerProps,
  MapViewState,
  PickingInfo,
  WebMercatorViewport,
} from 'deck.gl/typed';
import { max, min, zip } from 'lodash';

import { DeckMap, DeckMapProps } from './DeckMap';

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, anchorY: 128, mask: true },
};

export function getBoundingBox(points: number[][]) {
  const [xCoords, yCoords] = zip(...points);
  // return [(min(xCoords), min(yCoords)), (max(xCoords), max(yCoords))]
  // // format: [minLat, minLng, maxLat, maxLng]
  // return [min(xCoords), min(yCoords), max(xCoords), max(yCoords)]
  // format: [minLng, minLat, maxLng, maxLat]
  return [min(yCoords), min(xCoords), max(yCoords), max(xCoords)];
}

type CoordObj = Record<string, any> & {
  coordinates: GeoPoint | { latitude: number; longitude: number };
};

export interface LocationsMapProps extends Omit<DeckMapProps, 'layers' | 'hoverInfo'> {
  data: CoordObj[];
  layerProps?: Omit<IconLayerProps, 'data' | 'id' | 'getSize' | 'onHover'>;
}

export const LocationsMap = ({ data, layerProps, ...props }: LocationsMapProps) => {
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
      const viewport = new WebMercatorViewport({ height: 500, width: window.innerWidth }); // mapStateView
      const { longitude, latitude, zoom } = viewport.fitBounds(
        [
          [minLat, minLng],
          [maxLat, maxLng],
        ],
        {
          padding: 40,
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
          iconAtlas:
            'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
          iconMapping: ICON_MAPPING,
          getPosition: (d: CoordObj) => [d.coordinates.longitude, d.coordinates.latitude],
          getIcon: (d) => 'marker',
          sizeScale: 5,
          getSize: (d) => 5,
          onHover: (info) => setHoverInfo(info),
          ...(layerProps || {}),
        }),
      ]}
      {...props}
    />
  );
};
