import { hyphenateSync } from 'hyphen/en';

// https://github.com/diegomura/react-pdf/blob/master/packages/textkit/src/engines/wordHyphenation/index.js

const SOFT_HYPHEN = '\u00ad';
const splitHyphen = (word: string) => word.split(SOFT_HYPHEN);

const cache: Record<string, string[]> = {};

const getParts = (word: string) => {
  // BUG: splitting on hard hyphen removes hyphen from IDs
  if (word.includes('-')) return word.split('-');

  const base = hyphenateSync(word);
  return splitHyphen(base);
};

export const wordHyphenation = (word: string) => {
  const cacheKey = `_${word}`;

  if (!word) return [];
  if (cache[cacheKey]) return cache[cacheKey];

  cache[cacheKey] = getParts(word);

  return cache[cacheKey];
};
