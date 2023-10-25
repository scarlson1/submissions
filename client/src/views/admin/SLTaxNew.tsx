import { Box, Typography } from '@mui/material';
import { Timestamp, addDoc } from 'firebase/firestore';
import { FormikHelpers } from 'formik';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFirestore } from 'reactfire';

import { TTax, taxesCollection } from 'common';
import { TaxForm, TaxValues } from 'elements/forms/TaxForm';
import { useAsyncToast } from 'hooks';
import { getNumber } from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath } from 'router';

export const SLTaxNew = () => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const toast = useAsyncToast({ position: 'top-right' });

  const handleSubmit = useCallback(
    async (values: TaxValues, { setSubmitting, setFieldError }: FormikHelpers<TaxValues>) => {
      try {
        const isFixedRate = values.subjectBase[0] === 'fixedFee';
        const rate = isFixedRate ? values.fixedRate : parseFloat(getNumber(values.rate)) / 100;
        if (!rate || isNaN(rate)) {
          setFieldError('fixedRate', 'Missing rate');
          return setSubmitting(false);
        }
        const effTimestamp = Timestamp.fromDate(values.effectiveDate);
        const expTimestamp = values.expirationDate
          ? Timestamp.fromDate(values.expirationDate)
          : null;
        const { fixedRate: _, ...rest } = values;

        const tax: TTax = {
          ...rest,
          rate,
          rateType: isFixedRate ? 'fixed' : 'percent',
          effectiveDate: effTimestamp,
          expirationDate: expTimestamp,
          metadata: {
            created: Timestamp.now(),
            updated: Timestamp.now(),
          },
        };

        toast.loading('saving...');
        const docRef = await addDoc(taxesCollection(firestore), tax);

        setSubmitting(false);
        toast.success(`New tax created (ID: ${docRef.id})`);
        navigate(createPath({ path: ADMIN_ROUTES.SL_TAXES }));
      } catch (err) {
        console.log('ERROR: ', err);
        setSubmitting(false);
      }
    },
    [navigate, firestore, toast]
  );

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ ml: 3 }}>
        New Surplus Lines Tax
      </Typography>
      <TaxForm onSubmit={handleSubmit} />
    </Box>
  );
};
