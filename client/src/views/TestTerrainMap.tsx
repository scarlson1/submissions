import { Box } from '@mui/material';
import Map, { Source, Layer } from 'react-map-gl';
import type { SkyLayer } from 'react-map-gl';

// Deck.gl terrain layer: https://deck.gl/docs/api-reference/geo-layers/terrain-layer

const skyLayer: SkyLayer = {
  id: 'sky',
  type: 'sky',
  paint: {
    'sky-type': 'atmosphere',
    'sky-atmosphere-sun': [0.0, 0.0],
    'sky-atmosphere-sun-intensity': 15,
  },
};

export default function TestTerrainLayer() {
  return (
    // <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <Box sx={{ height: 300, width: '100%' }}>
      <Map
        initialViewState={{
          latitude: 32.6141,
          longitude: -114.34411,
          zoom: 14,
          bearing: 80,
          pitch: 80,
        }}
        maxPitch={85}
        mapStyle='mapbox://styles/mapbox/satellite-v9'
        terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
      >
        <Source
          id='mapbox-dem'
          type='raster-dem'
          url='mapbox://mapbox.mapbox-terrain-dem-v1'
          tileSize={512}
          maxzoom={14}
        />
        <Layer {...skyLayer} />
      </Map>
    </Box>
    // </Box>
  );
}

// const geojson: FeatureCollection = {
//   type: 'FeatureCollection',
//   features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [-122.4, 37.8] } }],
// };

// const layerStyle: CircleLayer = {
//   id: 'point',
//   type: 'circle',
//   paint: {
//     'circle-radius': 10,
//     'circle-color': '#007cbf',
//   },
// };

// https://docs.mapbox.com/data/tilesets/reference/mapbox-naip/

export function TestNAIPLayer() {
  return (
    <Box sx={{ height: 300, width: '100%' }}>
      <Map
        initialViewState={{
          latitude: 36.4654,
          longitude: -86.6545,
          zoom: 14,
          // bearing: 80,
          // pitch: 80,
        }}
        maxPitch={85}
        mapStyle='mapbox://styles/mapbox/satellite-v9'
        // terrain={{ source: 'mapbox-dem', exaggeration: 1.5 }}
      >
        <Source id='mapbox-naip' type='raster' url='mapbox://mapbox.naip'>
          <Layer id='mapbox-naip-layer' source='mapbox-naip' type='raster' />
        </Source>
      </Map>
    </Box>
  );
}

// "sources": {
// "mapbox-naip": {
// "type": "raster",
// "url": "mapbox://mapbox.naip"
// }
// },
// "layers": [
// {
// "id": "mapbox-naip-layer",
// "source": "mapbox-naip",
// "type": "raster"
// }
// ]
