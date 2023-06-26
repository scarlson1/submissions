// import { GridColDef } from '@mui/x-data-grid';
import { ProviderId } from 'firebase/auth';
import { Product } from './types';
// import { renderGridEmail } from 'components/RenderGridCellHelpers';

export const SUPPORTED_AUTH_PROVIDER_IDS = [
  ProviderId.PASSWORD,
  ProviderId.GOOGLE,
  'microsoft.com',
  ProviderId.PHONE,
];

export const STATES_URL = 'https://scarlson1.github.io/data/states_20m.json';

export const COUNTIES_URL = 'https://scarlson1.github.io/data/counties_20m.json';

export const MAP_ICON_URL = 'https://scarlson1.github.io/icon-atlas.png';

export const PRODUCT_OPTIONS: Product[] = ['flood', 'wind'];

export const LOB_OPTIONS: string[] = ['residential', 'commercial'];

// export const ACTIVE_STATES = [
//   'Arizona',
//   'Connecticut',
//   'Florida',
//   'Idaho',
//   'Louisiana',
//   'Maryland',
//   'Michigan',
//   'Minnesota',
//   'Montana',
//   'Oklahoma',
//   'Pennsylvania',
//   'Texas',
//   'Virginia',
//   'Wisconsin',
//   'West Virginia',
// ];

// export const ACTIVE_STATES_ABRV = [
//   'AZ',
//   'CT',
//   'FL',
//   'ID',
//   'LA',
//   'MD',
//   'MI',
//   'MN',
//   'MT',
//   'OK',
//   'PA',
//   'TX',
//   'VA',
//   'WI',
//   'WV',
// ];

export const stateFIPS = {
  ALABAMA: '01',
  ALASKA: '02',
  ARIZONA: '04',
  ARKANSAS: '05',
  CALIFORNIA: '06',
  COLORADO: '08',
  CONNECTICUT: '09',
  DELAWARE: '10',
  'DISTRICT OF COLUMBIA': '11',
  FLORIDA: '12',
  GEORGIA: '13',
  HAWAII: '15',
  IDAHO: '16',
  ILLINOIS: '17',
  INDIANA: '18',
  IOWA: '19',
  KANSAS: '20',
  KENTUCKY: '21',
  LOUISIANA: '22',
  MAINE: '23',
  MARYLAND: '24',
  MASSACHUSETTS: '25',
  MICHIGAN: '26',
  MINNESOTA: '27',
  MISSISSIPPI: '28',
  MISSOURI: '29',
  MONTANA: '30',
  NEBRASKA: '31',
  NEVADA: '32',
  'NEW HAMPSHIRE': '33',
  'NEW JERSEY': '34',
  'NEW MEXICO': '35',
  'NEW YORK': '36',
  'NORTH CAROLINA': '37',
  'NORTH DAKOTA': '38',
  OHIO: '39',
  OKLAHOMA: '40',
  OREGON: '41',
  PENNSYLVANIA: '42',
  'RHODE ISLAND': '44',
  'SOUTH CAROLINA': '45',
  'SOUTH DAKOTA': '46',
  TENNESSEE: '47',
  TEXAS: '48',
  UTAH: '49',
  VERMONT: '50',
  VIRGINIA: '51',
  WASHINGTON: '53',
  'WEST VIRGINIA': '54',
  WISCONSIN: '55',
  WYOMING: '56',
};

// 0, 0.01, 0.02, 0.03, 0.04,
export const COMMISSION_OPTIONS = [
  0.05, 0.06, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15, 0.16, 0.17, 0.18, 0.19, 0.2,
];

export const fallbackImages = [
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-interior-1.jpg?alt=media&token=2d23e76d-2ea4-403e-9f0e-93bbaacebf3e',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-interior-2.jpg?alt=media&token=720e4102-0c2e-48f9-8b36-c85b0daeaa33',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-kitchen-1.jpg?alt=media&token=45123914-5cf6-4e2f-976c-76d6009d6371',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhome-snow-dusk-1.jpg?alt=media&token=1de02ecb-2dfc-46fb-a2e6-0a223f0d3ac0',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fhouse-day-1.jpg?alt=media&token=c4395078-19af-4fc0-92da-3d9e2ef6ef37',
  'https://firebasestorage.googleapis.com/v0/b/idemand-submissions.appspot.com/o/common%2Fneighborhood-aerial-1.jpg?alt=media&token=9f80797b-2449-4229-bb2d-b5eb224d86af',
];
