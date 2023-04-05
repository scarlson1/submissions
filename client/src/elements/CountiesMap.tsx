import React, { useState } from 'react';
import { useTheme } from '@mui/material';

import { DeckMap, defaultGeoJsonLayerProps } from './DeckMap';
import { FIPSDetails } from 'common';
import { GeoJsonLayer, PickingInfo } from 'deck.gl/typed';

const COUNTIES_JSON_STORAGE_PATH = `public/geo-spatial/counties_20m.json`;
// const COUNTIES_URL = 'https://scarlson1.github.io/data/states_20m.json';

export interface CountiesMapProps {
  selectedCounties?: FIPSDetails[];
  layerProps?: any;
}

export const CountiesMap: React.FC<CountiesMapProps> = ({ selectedCounties, layerProps }) => {
  const theme = useTheme();
  // const storage = useStorage();
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();

  // const { data: countiesURL } = useStorageDownloadURL(ref(storage, COUNTIES_JSON_STORAGE_PATH));

  return (
    <DeckMap
      hoverInfo={hoverInfo}
      renderTooltipContent={(info: PickingInfo) =>
        `${info.object.properties?.NAME} (${info.object.properties?.GEOID})`
      }
      layers={[
        new GeoJsonLayer({
          ...defaultGeoJsonLayerProps,
          id: `geojson-layer-counties`, // @ts-ignore
          // data: countiesData,
          // data: countiesURL,
          data: COUNTIES_URL,
          highlightColor: theme.palette.mode === 'dark' ? [255, 255, 255, 25] : [80, 144, 211, 20],
          getLineColor: theme.palette.mode === 'dark' ? [255, 255, 255, 200] : [178, 186, 194, 200],
          getFillColor: (f) =>
            !!selectedCounties?.some(
              (c: FIPSDetails) => `${c.stateFP}${c.countyFP}` === f.properties?.GEOID
            )
              ? [0, 125, 255, 50]
              : [255, 255, 255, 20],
          updateTriggers: {
            getFillColor: [selectedCounties],
          },
          onHover: (info: PickingInfo) => setHoverInfo(info),
          ...layerProps,
        }),
      ]}
    />
  );
};
