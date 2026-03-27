import { useTheme } from '@mui/material';
import { IconLayer, IconLayerProps, MapViewState, PickingInfo } from 'deck.gl';
import { useEffect, useRef, useState } from 'react';

import { useFlyToBounds } from 'hooks';
import { CoordObj, getPlaceMarker, svgToDataURL } from 'modules/utils';
import { DeckMap, DeckMapProps } from './DeckMap';

export interface LocationsMapProps extends Omit<
  DeckMapProps,
  'layers' | 'hoverInfo'
> {
  data: CoordObj[];
  layerProps?: Omit<IconLayerProps, 'data' | 'id' | 'getSize' | 'onHover'>;
}

export const LocationsMap = ({
  data,
  layerProps,
  ...props
}: LocationsMapProps) => {
  const theme = useTheme();
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();
  const [mapViewState, setMapViewState] = useState<MapViewState>({
    longitude: -94.25,
    latitude: 38.25,
    zoom: 3.5,
    maxZoom: 16,
    minZoom: 3,
  });
  const mapLoaded = useRef(false);
  const flyToBounds = useFlyToBounds(data, setMapViewState, 2000);

  useEffect(() => {
    mapLoaded.current && flyToBounds();
  }, [flyToBounds]);

  return (
    <DeckMap
      // mapViewState={mapViewState}
      initialViewState={mapViewState}
      // viewState={}
      // onViewStateChange={(e: ViewStateChangeParameters) => setMapViewState(e.viewState)}
      hoverInfo={hoverInfo}
      layers={[
        new IconLayer({
          id: 'locations-layer',
          data: data || [],
          getIcon: (d: CoordObj) => ({
            url: svgToDataURL(
              `${getPlaceMarker(
                d.cancelEffDate
                  ? theme.palette.primaryDark.main
                  : theme.palette.primary.main,
              )}`,
            ),
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
      onLoad={() => {
        flyToBounds();
        mapLoaded.current = true;
      }}
      {...props}
    />
  );
};
