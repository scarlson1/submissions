import { customAlphabet } from 'nanoid';

const ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
export const nanoId = customAlphabet(ALPHABET, 9);

export const createDocId = nanoId;

// export const getDigits = (str: string) => str.replace(/^\D+/g, '');
export const getDigits = (str: string) => str.replace(/[^0-9\.]+/g, ''); // eslint-disable-line
