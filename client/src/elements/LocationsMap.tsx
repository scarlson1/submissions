import React, { useState } from 'react';
import { GeoPoint } from 'firebase/firestore';
import { IconLayer, IconLayerProps, PickingInfo } from 'deck.gl/typed';

import { DeckMap, DeckMapProps } from './DeckMap';

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, mask: true },
};

type CoordObj = Record<string, any> & {
  coordinates: GeoPoint | { latitude: number; longitude: number };
};

export interface LocationsMapProps extends Omit<DeckMapProps, 'layers' | 'hoverInfo'> {
  data: CoordObj[];
  layerProps?: Omit<IconLayerProps, 'data' | 'id' | 'getSize' | 'onHover'>;
}

// TODO: get initial map bounds from data (see GeoSearch)

export const LocationsMap = ({ data, layerProps, ...props }: LocationsMapProps) => {
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();
  console.log('HOVER INFO: ', hoverInfo);

  return (
    <DeckMap
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
