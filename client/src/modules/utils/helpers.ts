import * as _ from 'lodash';
import { formatDistance, format } from 'date-fns';
import numeral from 'numeral';
import { Location } from 'react-router-dom';

import { AddressComponent, AddressComponentType } from 'components/forms';
import { FirestoreTimestamp } from 'common/types';

export const findAddressValueByType = (
  addressObj: AddressComponent[],
  addressType: AddressComponentType
) => {
  return _.find(addressObj, (o) => {
    return o.types[0] === addressType;
  });
};

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const formatPhoneNumber = (str: string) => {
  //Filter only numbers from the input
  let cleaned = ('' + str).replace(/\D/g, '');

  //Check if the input is of correct
  let match = cleaned.match(/^(1|)?(\d{3})(\d{3})(\d{4})$/);

  if (match) {
    //Remove the matched extension code
    //Change this to format for any country code.
    // Non-breakable space is char 160
    let intlCode = match[1] ? `+1${String.fromCharCode(160)}` : '';
    // return [intlCode, '(', match[2], ') ', match[3], '-', match[4]].join('');
    return [intlCode, '(', match[2], `)${String.fromCharCode(160)}`, match[3], '-', match[4]].join(
      ''
    );
  }

  return null;
};

export const dollarFormat = (val: string | number) => numeral(val).format('$0,0[.]00');

export const getRedirectPath = (location: Location) => {
  let redirectProvided =
    location.state && location.state.redirectPath ? location.state.redirectPath : null;
  let from = location.state?.from?.pathname || '/';
  let redirectPath = redirectProvided || from;
  console.log('location: ', location);
  console.log('redirectPath: ', redirectPath);

  return redirectPath;
};

export const formatFirestoreTimestamp = (
  ts: FirestoreTimestamp,
  formatType: 'date' | 'relative' = 'relative'
) => {
  let tsDate = new Date(ts.seconds * 1000);
  return formatType === 'relative'
    ? formatDistance(tsDate, new Date(), { addSuffix: true })
    : format(tsDate, 'MMM dd, yyyy');
};

export const validateRoutingNumber = (val?: string) => {
  if (!val || val.length !== 9) {
    return false;
  }
  const digits = val.split('');
  let total = 0;
  for (let i = 0; i < 9; i += 3) {
    total += parseInt(digits[i]) * 3;
    total += parseInt(digits[i + 1]) * 7;
    total += parseInt(digits[i + 2]);
  }
  console.log('routing number total: ', total);

  const isValid = total !== 0 && total % 10 === 0;

  return isValid;
};

export const isValidEmail = (str: string) => {
  // eslint-disable-next-line
  return /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
    str
  );
};
