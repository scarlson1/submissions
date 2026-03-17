import { FlyToInterpolator, MapViewState } from 'deck.gl';
import { Dispatch, SetStateAction, useCallback } from 'react';

import { getBoundsViewPort } from 'elements/maps/utils';
import { CoordObj } from 'modules/utils';

const transitionInterpolator = new FlyToInterpolator();

export type FlyToBoundsData = (CoordObj & Record<string, any>)[];

export const useFlyToBounds = (
  data: FlyToBoundsData,
  setMapViewState: Dispatch<SetStateAction<MapViewState>>,
  transitionDuration: number = 2000,
) => {
  return useCallback(() => {
    if (!data.length) return;
    // alternatively: use bbox from turf and useRef.current.fitBounds with duration: 1000 in config
    // https://github.com/visgl/react-map-gl/blob/7.1-release/examples/zoom-to-bounds/src/app.tsx
    // TODO: check if prev equal to current --> ignore

    const coordsArr = data
      .filter((d) => d.coordinates)
      .map((d) => [d.coordinates?.longitude, d.coordinates?.latitude]);
    if (!coordsArr.length) return;

    const boundedViewPort = getBoundsViewPort(coordsArr);
    if (!boundedViewPort) return;
    const { longitude, latitude, zoom } = boundedViewPort;

    setMapViewState((prev) => ({
      ...prev,
      latitude,
      longitude,
      zoom,
      transitionDuration,
      transitionInterpolator,
    }));
  }, [transitionDuration, data]);
};
