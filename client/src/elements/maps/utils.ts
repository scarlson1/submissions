import { WebMercatorViewport } from 'deck.gl';

import { getBoundingBox } from 'modules/utils';

export function getBoundsViewPort(coordsArr: number[][]) {
  const [minLng, minLat, maxLng, maxLat] = getBoundingBox(coordsArr);
  if (
    typeof minLng === 'number' &&
    typeof minLat === 'number' &&
    typeof maxLng === 'number' &&
    typeof maxLat === 'number'
  ) {
    // https://stackoverflow.com/a/63577542
    const viewport = new WebMercatorViewport({
      height: 500,
      width: window.innerWidth,
    });
    // const { longitude, latitude, zoom } = viewport.fitBounds(
    return viewport.fitBounds(
      [
        [minLat, minLng],
        [maxLat, maxLng],
      ],
      {
        padding: 80,
      },
    );
  } else return null;
}
