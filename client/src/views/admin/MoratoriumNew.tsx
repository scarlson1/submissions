import { FormikHelpers } from 'formik';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

import { MoratoriumForm, MoratoriumValues } from 'elements/forms';
import { useCreateMoratorium } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';

const initialValues = {
  locationDetails: [],
  effectiveDate: new Date(),
  expirationDate: null,
  product: ['flood'],
  reason: '',
};

export const MoratoriumNew = () => {
  const navigate = useNavigate();

  const createMoratorium = useCreateMoratorium({
    onSuccess: (id: string) => {
      toast.success(`Moratorium created (ID: ${id})`);
      navigate(createPath({ path: ADMIN_ROUTES.MORATORIUMS }));
    },
    onError: (err: unknown, msg: string) => toast.error(msg),
  });

  const handleSubmit = useCallback(
    async (values: MoratoriumValues, { setSubmitting }: FormikHelpers<MoratoriumValues>) => {
      await createMoratorium(values);
      setSubmitting(false);
    },
    [createMoratorium]
  );

  return (
    <MoratoriumForm title='New Moratorium' onSubmit={handleSubmit} initialValues={initialValues} />
  );
};
