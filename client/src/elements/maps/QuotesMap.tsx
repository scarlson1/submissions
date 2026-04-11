import { Card, useTheme } from '@mui/material';
import { IconLayer, MapViewState } from 'deck.gl';
import { QueryFieldFilterConstraint } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';

import type { WithId } from '@idemand/common';
import { Policy, Quote } from 'common';
import { useCollectionData, useFlyToBounds } from 'hooks';
import {
  CoordObj,
  getPlaceMarker,
  svgToDataURL,
  TypedPickingInfo,
} from 'modules/utils';
import { DEFAULT_INITIAL_VIEW_STATE } from './constants';
import { DeckMap } from './DeckMap';
import { renderQuoteTooltip } from './renderTooltips';

export interface QuotesMapProps {
  constraints: QueryFieldFilterConstraint[];
}

export const QuotesMap = ({ constraints }: QuotesMapProps) => {
  const theme = useTheme();
  const [mapViewState, setMapViewState] = useState<MapViewState>(
    DEFAULT_INITIAL_VIEW_STATE,
  );
  const [hoverInfo, setHoverInfo] =
    useState<TypedPickingInfo<WithId<Policy>>>();
  const { data } = useCollectionData<Quote>('quotes', constraints, {
    idField: 'id',
  });
  const flyToBounds = useFlyToBounds(data, setMapViewState, 2000);
  const mapLoaded = useRef(false);

  useEffect(() => {
    mapLoaded.current && flyToBounds();
  }, [flyToBounds]);

  const layers = [
    new IconLayer({
      id: 'quotes-layer',
      data: data,
      pickable: true,
      getIcon: (d: CoordObj) => ({
        url: svgToDataURL(
          `${getPlaceMarker(theme.palette.primary.main)}`, // TODO: grey out expired quotes & green if bound ??
        ),
        width: 36,
        height: 36,
        anchorX: 18,
        anchorY: 36,
      }),
      getPosition: (d: any) => [
        d?.coordinates?.longitude || 0,
        d?.coordinates?.latitude || 0,
      ],
      sizeScale: 5,
      getSize: (d) => 5,
      onHover: (info) => setHoverInfo(info),
      updateTriggers: {
        getIcon: [theme.palette.mode],
      },
    }),
  ];

  return (
    <Card
      sx={{
        height: { xs: 360, sm: 400, lg: 500 },
        width: '100%',
        position: 'relative',
      }}
    >
      <DeckMap
        layers={layers}
        hoverInfo={hoverInfo}
        renderTooltipContent={renderQuoteTooltip}
        initialViewState={mapViewState}
        onLoad={() => {
          flyToBounds();
          mapLoaded.current = true;
        }}
      />
    </Card>
  );
};
