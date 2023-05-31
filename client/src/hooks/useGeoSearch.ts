// DOCS REF:
// https://www.algolia.com/doc/guides/building-search-ui/ui-and-ux-patterns/geo-search/react-hooks/
import connectGeoSearch from 'instantsearch.js/es/connectors/geo-search/connectGeoSearch';
import { useConnector } from 'react-instantsearch-hooks-web';
import type { BaseHit } from 'instantsearch.js';
import type {
  GeoSearchConnector,
  GeoSearchConnectorParams,
  GeoSearchWidgetDescription,
} from 'instantsearch.js/es/connectors/geo-search/connectGeoSearch';

type UseGeoSearchProps<THit extends BaseHit> = GeoSearchConnectorParams<THit>;

export function useGeoSearch<THit extends BaseHit>(props?: UseGeoSearchProps<THit>) {
  return useConnector<GeoSearchConnectorParams<THit>, GeoSearchWidgetDescription<THit>>(
    connectGeoSearch as GeoSearchConnector<THit>,
    props
  );
}

// type Hit<THit extends BaseHit = Record<string, any>> = {
//   __position: number;
//   __queryID?: string;
// } & AlgoliaHit<THit>;

// export type GeoHit<THit extends BaseHit = Record<string, any>> = Hit<THit> &
//   Required<Pick<Hit, '_geoloc'>>;

// DEMO: https://preview.algolia.com/geo-search/

// USAGE:

// import React from 'react';
// import { Marker, Popup } from 'react-leaflet';
// import { useGeoSearch } from './useGeoSearch';

// type Airport = {
//   name: string;
//   city: string;
//   country: string;
//   iata_code: string;
//   links_count: number;
// }

// export function Airports() {
//   const {
//     items,
//   } = useGeoSearch<Airport>();

//   return (
//     <>
//       {items.map((item) => (
//         <Marker
//           key={item.objectID}
//           position={item._geoloc}
//         >
//           <Popup>
//             <strong>{item.name}</strong>
//             <br />
//             {item.city}, {item.country}
//           </Popup>
//         </Marker>
//       ))}
//     </>
//   );
// }

// MAP:

// import { useState } from 'react';
// import { useSearchBox } from 'react-instantsearch-hooks-web';
// import algoliasearch from 'algoliasearch/lite';
// import { InstantSearch, SearchBox } from 'react-instantsearch-hooks-web';
// import { MapContainer, TileLayer } from 'react-leaflet';

// const searchClient = algoliasearch('latency', '6be0576ff61c053d5f9a3225e2a90f76');

// export function Airports() {
//   const { query, refine: refineQuery } = useSearchBox();
//   const {
//     items,
//     refine: refineItems,
//     currentRefinement,
//     clearMapRefinement,
//   } = useGeoSearch();

//   const [previousQuery, setPreviousQuery] = useState(query);
//   const [skipViewEffect, setSkipViewEffect] = useState(false);

//   // When the user moves the map, we clear the query if necessary to only
//   // refine on the new boundaries of the map.
//   const onViewChange = ({ target }) => {
//     setSkipViewEffect(true);

//     if (query.length > 0) {
//       refineQuery('');
//     }

//     refineItems({
//       northEast: target.getBounds().getNorthEast(),
//       southWest: target.getBounds().getSouthWest(),
//     });
//   };

//   const map = useMapEvents({
//     zoomend: onViewChange,
//     dragend: onViewChange,
//   });

//   // When the query changes, we remove the boundary refinement if necessary and
//   // we center the map on the first result.
//   if (query !== previousQuery) {
//     if (currentRefinement) {
//       clearMapRefinement();
//     }

//     // `skipViewEffect` allows us to bail out of centering on the first result
//     // if the query has been cleared programmatically.
//     if (items.length > 0 && !skipViewEffect) {
//       map.setView(items[0]._geoloc);
//     }

//     setSkipViewEffect(false);
//     setPreviousQuery(query);
//   }

//   return (
// <InstantSearch searchClient={searchClient} indexName='airports'>
//   <SearchBox placeholder='Search for airports...' />
//   <MapContainer style={{ height: '500px' }} center={[48.85, 2.35]} zoom={10}>
//     <TileLayer
//       attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//       url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
//     />
//   </MapContainer>
// </InstantSearch>;
//   );
// }
