import { deepmergeCustom } from 'deepmerge-ts';

// Docs: https://github.com/RebeccaStevens/deepmerge-ts/blob/HEAD/docs/deepmergeCustom.md

export const deepMergeOverwriteArrays = deepmergeCustom({
  mergeArrays: false,
});
