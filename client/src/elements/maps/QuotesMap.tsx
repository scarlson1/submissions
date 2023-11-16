import { Card, useTheme } from '@mui/material';
import { IconLayer } from 'deck.gl/typed';
import { QueryFieldFilterConstraint } from 'firebase/firestore';
import { useState } from 'react';

import { Policy, Quote, WithId } from 'common';
import { useCollectionData } from 'hooks';
import { CoordObj, TypedPickingInfo, getPlaceMarker, svgToDataURL } from 'modules/utils';
import { DeckMap } from './DeckMap';
import { renderQuoteTooltip } from './renderTooltips';

export interface QuotesMapProps {
  constraints: QueryFieldFilterConstraint[];
}

export const QuotesMap = ({ constraints }: QuotesMapProps) => {
  const theme = useTheme();
  const [hoverInfo, setHoverInfo] = useState<TypedPickingInfo<WithId<Policy>>>();

  const { data } = useCollectionData<Quote>('QUOTES', constraints, { idField: 'id' });

  const layers = [
    new IconLayer({
      id: 'quotes-layer',
      data: data,
      pickable: true,
      getIcon: (d: CoordObj) => ({
        url: svgToDataURL(
          `${getPlaceMarker(theme.vars.palette.primary.main)}` // TODO: grey out expired quotes & green if bound ??
        ),
        width: 36,
        height: 36,
        anchorX: 18,
        anchorY: 36,
      }),
      // getPosition: (d: any) => [d?.coords?.longitude || 0, d?.coords?.latitude || 0],
      getPosition: (d: any) => [d?.coordinates?.longitude || 0, d?.coordinates?.latitude || 0],
      sizeScale: 5,
      getSize: (d) => 5,
      onHover: (info) => setHoverInfo(info),
      // updateTriggers: {
      //   getIcon: [theme.palette.mode],
      // },
    }),
  ];

  return (
    <Card sx={{ height: { xs: 360, sm: 400, lg: 500 }, width: '100%', position: 'relative' }}>
      <DeckMap
        layers={layers}
        hoverInfo={hoverInfo}
        renderTooltipContent={renderQuoteTooltip}
      ></DeckMap>
    </Card>
  );
};
