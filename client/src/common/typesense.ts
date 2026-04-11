import type { TCollection } from '@idemand/common';

export const typesenseIndexName = (collectionName: TCollection) =>
  `${import.meta.env.VITE_TYPESENSE_COLLECTION_PREFIX}_${collectionName}`;
