import { useEffect, useState, useMemo, useCallback } from 'react';
import { useFirestore, useFirestoreCollectionData } from 'reactfire';
import { collection, CollectionReference, limit, query } from 'firebase/firestore';
import { generateHTML } from '@tiptap/react';

import { COLLECTIONS, Disclosure } from 'common';
import { EDITOR_EXTENSION_DEFAULTS, useDialog } from 'hooks';
import { QueryArgs, mapWhereConstraints } from 'modules/utils';

// TODO: pass query constraints as array instead of state & product props

type DisclosureConstraints = QueryArgs[];

// export const useDisclosure = (state: string, product?: Product) => {
export const useDisclosure = (props: DisclosureConstraints = []) => {
  const firestore = useFirestore();
  const disclosuresCol = collection(
    firestore,
    COLLECTIONS.DISCLOSURES
  ) as CollectionReference<Disclosure>;

  // const q = useMemo(() => {
  //   const constraints = [where('state', '==', state)];
  //   if (product) constraints.push(where('products', 'array-contains', product));

  //   return query(disclosuresCol, ...constraints, limit(1));
  // }, [state, product, disclosuresCol]);

  const q = useMemo(
    () => query(disclosuresCol, ...mapWhereConstraints(props), limit(1)),
    [props, disclosuresCol]
  );

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

// TODO: text to disclosures collection ?? with fallback ??
export function useGeneralQuoteDisclosure() {
  const dialog = useDialog();

  return useCallback(
    async (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
      e.stopPropagation();
      e.preventDefault();

      await dialog.prompt({
        variant: 'info',
        catchOnCancel: false,
        title: 'Disclosure',
        description: `A request for quote is subject to all state regulations, including, but not limited to, license and due diligence requirements regarding non-admitted insurance. This website is not intended for business in any state not licensed. Any initial premium indication is not a quote until full submission information has been provided and approved including all state disclosure, taxes, and fees.`,
        slotProps: {
          dialog: { maxWidth: 'sm' },
        },
      });
    },
    [dialog]
  );
}
