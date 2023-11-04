import { Box, Typography } from '@mui/material';
import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { FormikHelpers } from 'formik';
import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFirestore } from 'reactfire';

import { TTax, taxesCollection } from 'common';
import { TaxForm, TaxValues } from 'elements/forms/TaxForm';
import { useAsyncToast, useDocData } from 'hooks';
import { getNumber } from 'modules/utils/helpers';
import { ADMIN_ROUTES, createPath } from 'router';

export const SLTaxEdit = () => {
  const navigate = useNavigate();
  const firestore = useFirestore();
  const toast = useAsyncToast({ position: 'top-right' });
  const { taxId } = useParams();
  if (!taxId) throw new Error('taxId required to edit.');
  const { data } = useDocData<TTax>('TAXES', taxId);

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

        toast.loading('saving changes...');
        const taxRef = doc(taxesCollection(firestore), taxId);
        await setDoc(
          taxRef,
          {
            ...rest,
            rate,
            rateType: isFixedRate ? 'fixed' : 'percent', // TODO: use zod enum
            effectiveDate: effTimestamp,
            expirationDate: expTimestamp,
            metadata: { updated: Timestamp.now() },
          },
          { merge: true }
        );

        setSubmitting(false);
        toast.success(`updated tax (ID: ${taxRef.id})`);
        navigate(createPath({ path: ADMIN_ROUTES.SL_TAXES }));
      } catch (err) {
        console.log('ERROR: ', err);
        setSubmitting(false);
      }
    },
    [navigate, firestore, toast, taxId]
  );

  return (
    <Box>
      <Typography variant='h5' gutterBottom sx={{ ml: 3 }}>
        Edit Surplus Lines Tax
      </Typography>
      <TaxForm
        onSubmit={handleSubmit}
        initialValues={{
          state: data?.state || '',
          displayName: data?.displayName || '',
          effectiveDate: data?.effectiveDate?.toDate() || new Date(),
          expirationDate: data?.expirationDate?.toDate() || null,
          LOB: data?.LOB || [],
          products: data?.products || [],
          transactionTypes: data?.transactionTypes || [],
          subjectBase: data?.subjectBase || [], // TODO: uncomment after prod data updated
          // rate: data?.rateType === 'percent' ? `${data?.rate * 100}` : '',
          rate:
            data?.subjectBase[0] !== 'fixedFee' && typeof data?.rate === 'number'
              ? `${data?.rate * 100}`
              : '',
          fixedRate:
            data?.subjectBase[0] === 'fixedFee' && typeof data?.rate === 'number'
              ? data?.rate || null
              : null,
          baseRoundType: data?.baseRoundType || 'nearest',
          baseDigits: data?.baseDigits ?? 2,
          resultRoundType: data?.resultRoundType || 'nearest',
          resultDigits: data?.resultDigits ?? 2,
          refundable: data?.refundable ?? true,
        }}
      />
    </Box>
  );
};
