import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from 'reactfire';

import { Moratorium, moratoriumsCollection } from 'common';
import { MoratoriumForm, MoratoriumValues } from 'elements/forms';
import { useAsyncToast, useDocData, useSafeParams } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';

function useUpdateMoratorium(
  moratoriumId: string,
  onSuccess?: () => void,
  onError?: (msg: string, err: any) => void
) {
  const firestore = useFirestore();

  return useCallback(
    async (values: MoratoriumValues) => {
      try {
        const moratoriumRef = doc(moratoriumsCollection(firestore), moratoriumId);
        await setDoc(
          moratoriumRef,
          {
            locationDetails: values.locationDetails,
            effectiveDate: Timestamp.fromDate(values.effectiveDate),
            expirationDate: values.expirationDate
              ? Timestamp.fromDate(values.expirationDate)
              : null,
            // TODO: less explicit setting product (map/reduce values)
            product: {
              flood: values.product.includes('flood'),
              wind: values.product.includes('wind'),
            },
            reason: values.reason || '',
          },
          { merge: true }
        );

        onSuccess && onSuccess();
      } catch (err: any) {
        let msg = err?.message || 'error saving moratorium';
        onError && onError(msg, err);
      }
    },
    [firestore, moratoriumId, onSuccess, onError]
  );
}

export const MoratoriumEdit = () => {
  const navigate = useNavigate();
  const { moratoriumId } = useSafeParams(['moratoriumId']);
  const toast = useAsyncToast({ position: 'top-right' });

  const { data } = useDocData<Moratorium>('moratoriums', moratoriumId);

  const updateMoratorium = useUpdateMoratorium(
    moratoriumId,
    () => {
      toast.success('saved!');
      navigate(createPath({ path: ADMIN_ROUTES.MORATORIUMS }));
    },
    (msg: string) => {
      toast.error(msg);
    }
  );

  return (
    <MoratoriumForm
      title='Edit Moratorium'
      onSubmit={updateMoratorium}
      initialValues={{
        locationDetails: [],
        effectiveDate: data.effectiveDate.toDate(),
        expirationDate: data.expirationDate?.toDate() || null,
        product: Object.entries(data.product)
          .filter(([key, val]) => val)
          .map(([product]) => product),
        reason: data.reason || '',
      }}
    />
  );
};
