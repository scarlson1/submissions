import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import { addDoc, collection, CollectionReference, Timestamp } from 'firebase/firestore';
import { useFirestore } from 'reactfire';
import { JSONContent } from '@tiptap/react';
// import { toast } from 'react-hot-toast';

import { COLLECTIONS, Disclosure } from 'common';
import { TextEditor } from 'components';
import { useAsyncToast } from 'hooks';

export const DisclosureNew: React.FC = () => {
  const firestore = useFirestore();
  const toast = useAsyncToast();

  const handleSave = useCallback(
    async (content: JSONContent) => {
      try {
        const disclosuresColl = collection(
          firestore,
          COLLECTIONS.DISCLOSURES
        ) as CollectionReference<Disclosure>;
        toast.loading('Saving...');
        const docRef = await addDoc(disclosuresColl, {
          products: ['flood', 'wind'],
          state: 'MN',
          content,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        });
        toast.success(`Saved! (ID: ${docRef.id})`);
      } catch (err: any) {
        console.log('ERROR: ', err);
        toast.error(`Error saving doc (${err.code || 'unknown'})`);
      }
    },
    [firestore, toast]
  );

  return (
    <Box>
      <TextEditor onSave={handleSave} />
    </Box>
  );
};
