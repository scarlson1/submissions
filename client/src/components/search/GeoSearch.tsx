import { useMemo, useState, useCallback, useEffect } from 'react';
import algoliasearch from 'algoliasearch/lite';
import { InstantSearch, SearchBox, useSearchBox } from 'react-instantsearch-hooks-web';
import { GeoHit } from 'instantsearch.js/es/connectors/geo-search/connectGeoSearch';
import { ViewStateChangeParameters } from '@deck.gl/core/typed/controllers/controller';

import { useDebounce, useGeoSearch } from 'hooks';
import { DeckMap } from 'elements';
import {
  FlyToInterpolator,
  IconLayer,
  MapViewState,
  PickingInfo,
  WebMercatorViewport,
} from 'deck.gl/typed';
import { Box } from '@mui/material';

type Airport = {
  name: string;
  city: string;
  country: string;
  iata_code: string;
  links_count: number;
};

interface Bounds {
  northEast: {
    lat: number;
    lng: number;
  };
  southWest: {
    lat: number;
    lng: number;
  };
}
const getBounds = (viewState: Record<string, any>) => {
  const viewport = new WebMercatorViewport(viewState);
  const nw = viewport.unproject([0, 0]);
  const se = viewport.unproject([viewport.width, viewport.height]);

  return {
    northEast: { lat: nw[1], lng: se[0] },
    southWest: { lat: se[1], lng: nw[0] },
  };
};

export const GeoSearch = () => {
  const searchClient = useMemo(
    () =>
      algoliasearch(
        process.env.REACT_APP_ALGOLIA_APP_ID as string,
        '0b42f45ac2a41041974441d5b419d215'
      ),
    []
  );

  return (
    <InstantSearch searchClient={searchClient} indexName='local_airports'>
      <Box sx={{ my: 4, height: '100%' }}>
        <Box sx={{ pb: 3 }}>
          <SearchBox placeholder='Search for airports' />
        </Box>
        <Airports />
      </Box>
    </InstantSearch>
  );
};

const ICON_MAPPING = {
  marker: { x: 0, y: 0, width: 128, height: 128, anchorY: 128, mask: true },
};

export function Airports() {
  const { query, refine: refineQuery } = useSearchBox();
  const {
    items,
    refine: refineItems,
    currentRefinement,
    clearMapRefinement,
  } = useGeoSearch<Airport>();
  const [previousQuery, setPreviousQuery] = useState(query);
  const [skipViewEffect, setSkipViewEffect] = useState(false);
  const [viewState, setViewState] = useState<MapViewState>({
    longitude: -94.25,
    latitude: 38.25,
    zoom: 3.5,
    maxZoom: 16,
    minZoom: 3,
    pitch: 0,
    bearing: 0,
  });
  const [bounds, setBounds] = useState<Bounds>(getBounds(viewState));
  const debouncedBounds = useDebounce<Bounds>(bounds, 100);
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();

  const handleViewChange = useCallback(
    ({
      viewState,
    }: ViewStateChangeParameters & {
      viewId: string;
    }) => {
      setViewState((prevState) => ({ ...prevState, ...viewState }));

      setSkipViewEffect(true);
      // When map moved, clear query -> only refine on new boundaries
      if (query.length > 0) {
        refineQuery('');
      }

      const newBounds = getBounds(viewState);
      setBounds(newBounds);
    },
    [query, refineQuery]
  );

  useEffect(() => {
    if (debouncedBounds) refineItems(debouncedBounds);
  }, [debouncedBounds, refineItems]);

  if (query !== previousQuery) {
    if (currentRefinement) {
      clearMapRefinement();
    }
    // `skipViewEffect` allows bail out of centering on the first result
    // if the query has been cleared programmatically.
    if (items.length > 0 && !skipViewEffect) {
      console.log('SETTING TOP RESULT: ', items[0]);
      setViewState((prevState) => ({
        ...prevState,
        longitude: items[0]._geoloc?.lng,
        latitude: items[0]._geoloc?.lat,
        transitionDuration: 2000,
        transitionInterpolator: new FlyToInterpolator(),
      }));
    }

    setSkipViewEffect(false);
    setPreviousQuery(query);
  }

  const airportLayer = new IconLayer({
    id: 'icon-layer',
    data: items,
    iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
    iconMapping: ICON_MAPPING,
    getIcon: (d) => 'marker',
    pickable: true,
    sizeScale: 24,
    getPosition: (d: GeoHit<Airport>) => [d._geoloc?.lng, d._geoloc?.lat],
    onHover: (info) => setHoverInfo(info),
  });

  return (
    <DeckMap
      mapViewState={viewState}
      onViewStateChange={handleViewChange}
      layers={[airportLayer]}
      hoverInfo={hoverInfo}
      renderTooltipContent={(info: PickingInfo) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>{info.object.iata_code || ''}</Box>
      )}
      pickingRadius={5}
    />
  );
}
