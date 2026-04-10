import type { Coords, GeoPoint } from '@idemand/common';
import axios from 'axios';

// latitude: number, longitude: number)
export async function getFEMAFloodZone({
  latitude,
  longitude,
}: Coords | GeoPoint) {
  let url = `https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=${longitude}%2C${latitude}&geometryType=esriGeometryPoint&outFields=FLD_ZONE&returnGeometry=false&outSR=4326&f=json`;

  let { data } = await axios.get(url);

  let features = data?.features;
  if (features && features.length) {
    let floodZone = features[0].attributes?.FLD_ZONE;
    return floodZone || null;
  }

  return null;
}

// https://hazards-fema.maps.arcgis.com/apps/webappviewer/index.html?id=8b0adb51996444d4879338b5529aa9cd&extent=-81.61857504971884,28.542346582244583,-81.60857504971885,28.55234658224458

// let test1 = `https://cbrsgis.wim.usgs.gov/arcgis/rest/services/FEMA/CBRS_Prohibitions/MapServer/0/query?f=json&returnIdsOnly=true&returnCountOnly=true&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry=-96.6666%2C32.333&geometryType=esriGeometryPoint&inSR=102100&outSR=102100`;

// // North key lago, FL: 25.25573276671268, -80.32539694583977
// // FAILS (should return count > 0)
// let test2 = `https://cbrsgis.wim.usgs.gov/arcgis/rest/services/FEMA/CBRS_Prohibitions/MapServer/0/query?f=json&returnIdsOnly=true&returnCountOnly=true&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry=-80.32539694583977%2C25.25573276671268&geometryType=esriGeometryPoint&inSR=102100&outSR=102100`;

// // John Pennekamp State Park: 25.152847491029625, -80.3765472887079
// let test3 = `https://cbrsgis.wim.usgs.gov/arcgis/rest/services/FEMA/CBRS_Prohibitions/MapServer/0/query?f=json&where=1%3D1&returnGeometry=false&geometry=-80.3765472887079%2C25.152847491029625&geometryType=esriGeometryPoint&outSR=102100`; // returnIdsOnly=true&returnCountOnly=true // &spatialRel=esriSpatialRelIntersects // &inSR=102100&outSR=102100

// // Barnes sound, FL 25.228055654921654, -80.34151331929299

// // let test4 = `https://cbrsgis.wim.usgs.gov/arcgis/rest/services/FEMA/CBRS_Prohibitions/MapServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A
// // -9017531.201523367
// // %2C%22ymin%22%3A
// // 2904604.9010929493
// // %2C%22xmax%22%3A
// // -8872453.721838046
// // %2C%22ymax%22%3A
// // 2931816.4831624823
// // %2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&orderByFields=OBJECTID%20ASC&outSR=102100`;

// let test4 = `https://cbrsgis.wim.usgs.gov/arcgis/rest/services/FEMA/CBRS_Prohibitions/MapServer/0/query?f=json&where=1%3D1&returnGeometry=false&returnCountOnly=true&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A
// -80.34151331929299
// %2C%22ymin%22%3A
// 25.228055654921654
// %2C%22xmax%22%3A
// -80.341513
// %2C%22ymax%22%3A
// 25.228056
// %2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&orderByFields=OBJECTID%20ASC&outSR=102100`;

// let originalFromAboveUrl = `https://cbrsgis.wim.usgs.gov/arcgis/rest/services/FEMA/CBRS_Prohibitions/MapServer/0/query?f=json&returnIdsOnly=true&returnCountOnly=true&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A-9091452.115422886%2C%22ymin%22%3A3001408.1426205533%2C%22xmax%22%3A-9091046.043710064%2C%22ymax%22%3A3001713.293569452%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outSR=102100`;

// let original2 = `https://cbrsgis.wim.usgs.gov/arcgis/rest/services/FEMA/CBRS_Prohibitions/MapServer/0/query?f=json&where=1%3D1&returnGeometry=false&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A-9017531.201523367%2C%22ymin%22%3A2904604.9010929493%2C%22xmax%22%3A-8872453.721838046%2C%22ymax%22%3A2931816.4831624823%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%7D%7D&geometryType=esriGeometryEnvelope&inSR=102100&outFields=*&orderByFields=OBJECTID%20ASC&outSR=102100`;

// // esri envelope: https://developers.arcgis.com/documentation/common-data-types/geometry-objects.htm
// `%7B%22xmin%22%3A
// -9017531.201523367

// %2C%22ymin%22%3A
// 2904604.9010929493

// %2C%22xmax%22%3A
// -8872453.721838046

// %2C%22ymax%22%3A
// 2931816.4831624823
// %2C%22`;

// // {
// //   "xmin": <xmin>,
// //   "ymin": <ymin>,
// //   "xmax": <xmax>,
// //   "ymax": <ymax>,
// //   "spatialReference": {
// //     <spatialReference>
// //   }
// // }

// // {
// //   "xmin": -109.55,
// //   "ymin": 25.76,
// //   "xmax": -86.39,
// //   "ymax": 49.94,
// //   "spatialReference": {
// //     "wkid": 4326
// //   }
// // }

// // https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/layers

// // Get flood zone from FEMA NFHL
// // https://stackoverflow.com/questions/51563574/fema-nfhl-flood-hazard-zones-arcgis-online-api-access-through-vba

// // https://gis-fema.hub.arcgis.com/datasets/ae38b6f94eaf4abf97f986fa01921e13/api?layer=28

// // WORKS
// // hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&text=&objectIds=&time=&geometry=-96.6666%2C32.333&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelWithin&relationParam=&outFields=FLD_ZONE&returnGeometry=false&returnTrueCurves=false&maxAllowableOffset=&geometryPrecision=&outSR=&returnIdsOnly=false&returnCountOnly=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&returnZ=false&returnM=false&gdbVersion=&returnDistinctValues=false&resultOffset=&resultRecordCount=&queryByDistance=&returnExtentsOnly=false&datumTransformation=&parameterValues=&rangeValues=&f=pjson

// // WORKS
// // https://hazards.fema.gov/gis/nfhl/rest/services/public/NFHL/MapServer/28/query?where=1%3D1&geometry=-96.6666%2C32.333&geometryType=esriGeometryPoint&outFields=FLD_ZONE&returnGeometry=false&outSR=4326&f=pjson
