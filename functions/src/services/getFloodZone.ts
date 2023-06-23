import axios from 'axios';

export async function getFEMAFloodZone(latitude: number, longitude: number) {
  let url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${longitude}%2C${latitude}&geometryType=esriGeometryPoint&outFields=FLD_ZONE&returnGeometry=false&outSR=4326&f=json`;

  let { data } = await axios.get(url);

  let features = data?.features;
  if (features && features.length) {
    let floodZone = features[0].attributes?.FLD_ZONE;
    return floodZone || null;
  }

  return null;
}

// Get flood zone from FEMA NFHL
// https://stackoverflow.com/questions/51563574/fema-nfhl-flood-hazard-zones-arcgis-online-api-access-through-vba

// https://gis-fema.hub.arcgis.com/datasets/ae38b6f94eaf4abf97f986fa01921e13/api?layer=28

// WORKS
// hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&text=&objectIds=&time=&geometry=-96.6666%2C32.333&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&relationParam=&outFields=FLD_ZONE&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=pjson

// WORKS
// https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=-96.6666%2C32.333&geometryType=esriGeometryPoint&outFields=FLD_ZONE&returnGeometry=false&outSR=4326&f=pjson
