import { initializeApp } from 'firebase-admin/app';

initializeApp();

import { triggerportfolioexposure } from './callables/index.js';
import {
  computeportfolioexposure,
  reconciletaxtransactions,
  syncagentfunneltofirestore,
} from './cron/index.js';
import { bigquerysetup } from './requests/index.js';

import {
  syncpolicytobq,
  syncquotetobq,
  synctaxcalctobq,
  synctaxtransactiontobq,
  synctransactiontobq,
} from './firestoreEvents/index.js';
export const firestore = {
  syncpolicytobq,
  syncquotetobq,
  synctransactiontobq,
  synctaxtransactiontobq,
  synctaxcalctobq,
};

export {
  bigquerysetup,
  computeportfolioexposure,
  reconciletaxtransactions,
  syncagentfunneltofirestore,
  triggerportfolioexposure,
};
