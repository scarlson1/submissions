import { useEffect, useState, useMemo } from 'react';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';
import { collection, CollectionReference, limit, query, where } from 'firebase/firestore';
import { generateHTML } from '@tiptap/react';

import { COLLECTIONS, Disclosure, Product } from 'common';
import { EDITOR_EXTENSION_DEFAULTS } from 'hooks';

export const useDisclosure = (state: string, product?: Product) => {
  const firestore = useFirestore();
  const disclosuresCol = collection(
    firestore,
    COLLECTIONS.DISCLOSURES
  ) as CollectionReference<Disclosure>;

  const q = useMemo(() => {
    const constraints = [where('state', '==', state)];
    if (product) constraints.push(where('products', 'array-contains', product));
    return query(disclosuresCol, ...constraints, limit(1));
  }, [state, product, disclosuresCol]);
  const { status, data } = useFirestoreCollectionData(q, { idField: 'id', suspense: false });

  const [disclosureHTML, setDisclosureHTML] = useState<any>(null);

  useEffect(() => {
    if (!data || !data[0]) return;

    const jsonContent = data[0].content;
    if (!jsonContent) return;

    const content = generateHTML(jsonContent, EDITOR_EXTENSION_DEFAULTS);
    setDisclosureHTML(content);
  }, [data]);

  return useMemo(
    () => ({ disclosureHTML, disclosureContent: data, status }),
    [disclosureHTML, data, status]
  );
};
