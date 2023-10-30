import { add } from 'date-fns';

import {
  COMMISSION_OPTIONS,
  TBasement,
  TCBRSDesignation,
  TFloodZone,
  TPriorLossCount,
} from 'common';
import { getDateShortcuts } from 'modules/utils';
import { QuoteValues } from './QuoteForm';

export const policyEffShortcuts = getDateShortcuts([15, 30, 60]);

export const commOptions = COMMISSION_OPTIONS.map((o: number) => ({
  label: `${(o * 100).toFixed(0)}%`,
  value: o,
}));

export const gridProps = {
  columnSpacing: { xs: 3, sm: 4, md: 6 },
  rowSpacing: 6,
};

export const RATING_FIELDS = [
  'latitude',
  'longitude',
  'limitA',
  'limitB',
  'limitC',
  'limitD',
  'deductible',
  'priorLossCount',
  'numStories',
  'replacementCost',
];

export const DEFAULT_VALUES: QuoteValues = {
  address: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postal: '',
    countyName: '',
    countyFIPS: '',
  },
  coordinates: {
    latitude: null,
    longitude: null,
  },
  homeState: '',
  limits: {
    limitA: 250000,
    limitB: 12500,
    limitC: 67500,
    limitD: 25000,
  },
  deductible: 1000,
  effectiveExceptionRequested: false,
  effectiveDate: add(new Date(), { days: 15 }),
  // expirationDate: add(new Date(), { days: 15, years: 1 }),
  fees: [],
  taxes: [],
  annualPremium: null,
  subproducerCommission: 0.15,
  quoteTotal: null,
  namedInsured: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    userId: '',
  },
  agent: {
    userId: '',
    name: '',
    email: '',
    phone: '',
  },
  agency: {
    name: '',
    orgId: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      postal: '',
    },
  },
  ratingPropertyData: {
    CBRSDesignation: '' as TCBRSDesignation,
    basement: '' as TBasement,
    distToCoastFeet: null,
    floodZone: '' as TFloodZone,
    numStories: 0,
    propertyCode: '',
    replacementCost: null,
    sqFootage: null,
    yearBuilt: null,
    priorLossCount: '' as TPriorLossCount,
  },
  ratingDocId: '',
  AALs: {
    inland: null,
    surge: null,
    tsunami: null,
  },
  notes: [],
};
