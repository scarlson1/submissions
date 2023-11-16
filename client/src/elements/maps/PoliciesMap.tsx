import { Card, useTheme } from '@mui/material';
import { IconLayer } from 'deck.gl/typed';
import { QueryFieldFilterConstraint } from 'firebase/firestore';
import { flatten } from 'lodash';
import { useMemo, useState } from 'react';

import { Policy, WithId } from 'common';
import { useCollectionData } from 'hooks';
import { CoordObj, TypedPickingInfo, getPlaceMarker, svgToDataURL } from 'modules/utils';
import { DeckMap } from './DeckMap';
import { renderPolicyLocationTooltip } from './renderTooltips';

// which scenarios filter via query vs deck.gl filter ??
// reactfire subscriptions vs react query ??
// reusable filter hook between server data grid ??
// rxjs observable to join policy and location data ??
// pass query constraints and deck.gl filters as props ??
// add policies stats box ??
// zoom to bounding box

const LAYER_IDS = {
  policies: 'policy-layer',
  locations: 'locations-layer',
};

export interface PoliciesMapProps {
  constraints: QueryFieldFilterConstraint[];
}

export const PoliciesMap = ({ constraints }: PoliciesMapProps) => {
  const theme = useTheme();
  const [hoverInfo, setHoverInfo] = useState<TypedPickingInfo<WithId<Policy>>>();

  const { data: policies } = useCollectionData<Policy>('POLICIES', constraints, { idField: 'id' });

  const policyData = useMemo(() => {
    const policyLcns = policies.map(({ id, locations, ...p }) =>
      Object.entries(locations).map(([lcnId, lcn]) => ({ ...lcn, lcnId, policyId: id, policy: p }))
    );
    return flatten(policyLcns);
  }, [policies]);

  const layers = [
    new IconLayer({
      id: LAYER_IDS.policies,
      data: policyData,
      pickable: true,
      getIcon: (d: CoordObj) => ({
        url: svgToDataURL(
          `${getPlaceMarker(
            d.cancelEffDate ? theme.vars.palette.primaryDark.main : theme.vars.palette.primary.main
          )}`
        ),
        width: 36,
        height: 36,
        anchorX: 18,
        anchorY: 36,
      }),
      getPosition: (d: any) => [d?.coords?.longitude || 0, d?.coords?.latitude || 0],
      sizeScale: 5,
      getSize: (d) => 5,
      onHover: (info) => setHoverInfo(info),
      updateTriggers: {
        getIcon: [theme.palette.mode],
      },
    }),
  ];

  return (
    <Card sx={{ height: { xs: 360, sm: 400, lg: 500 }, width: '100%', position: 'relative' }}>
      <DeckMap
        layers={layers}
        hoverInfo={hoverInfo}
        renderTooltipContent={renderPolicyLocationTooltip}
      ></DeckMap>
    </Card>
  );
};
