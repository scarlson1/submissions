import type { TCollection } from 'common/enums';

export const typesenseIndexName = (collectionName: TCollection) =>
  `${import.meta.env.VITE_TYPESENSE_COLLECTION_PREFIX}_${collectionName}`;
