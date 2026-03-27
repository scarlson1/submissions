import { Timestamp } from 'firebase/firestore';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { Moratorium } from 'common';
import { MoratoriumForm, MoratoriumValues } from 'elements/forms';
import { useAsyncToast, useDocData, useSafeParams, useUpdateDoc } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';

export const MoratoriumEdit = () => {
  const navigate = useNavigate();
  const { moratoriumId } = useSafeParams(['moratoriumId']);
  const toast = useAsyncToast({ position: 'top-right' });

  const { data } = useDocData<Moratorium>('moratoriums', moratoriumId);

  const { update } = useUpdateDoc<Moratorium>(
    'moratoriums',
    () => {
      toast.success('saved!');
      navigate(createPath({ path: ADMIN_ROUTES.MORATORIUMS }));
    },
    (msg: string) => {
      toast.error(msg);
    }
  );

  const updateMoratorium = useCallback(
    (values: MoratoriumValues) => {
      const updates = {
        locationDetails: values.locationDetails,
        effectiveDate: Timestamp.fromDate(values.effectiveDate),
        expirationDate: values.expirationDate ? Timestamp.fromDate(values.expirationDate) : null,
        // TODO: less explicit setting product (map/reduce values)
        product: {
          flood: values.product.includes('flood'),
          wind: values.product.includes('wind'),
        },
        reason: values.reason || '',
      };
      return update(moratoriumId, updates);
    },
    [moratoriumId, update]
  );

  return (
    <MoratoriumForm
      title='Edit Moratorium'
      onSubmit={updateMoratorium}
      initialValues={{
        locationDetails: data.locationDetails || [],
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
