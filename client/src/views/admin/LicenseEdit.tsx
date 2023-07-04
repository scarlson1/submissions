import { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { FormikHelpers } from 'formik';
import { useNavigate, useParams } from 'react-router-dom';
import { Timestamp, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { useFirestore } from 'reactfire';

import { useAsyncToast, useDocData } from 'hooks';
import { checkForSLProducerLicense } from 'hooks/useCreateSLLicense';
import { ADMIN_ROUTES, createPath } from 'router';
import { LicenseForm, LicenseValues } from 'elements';
import { License, LicenseOwner, LicenseType, licensesCollection } from 'common';

export const LicenseEdit = () => {
  const firestore = useFirestore();
  const navigate = useNavigate();
  const toast = useAsyncToast({ position: 'top-right' });
  const { licenseId } = useParams();
  if (!licenseId) throw new Error('Missing license ID in URL params');

  const { data } = useDocData<License>('LICENSES', licenseId);

  const updateLicense = useCallback(
    async (values: LicenseValues) => {
      const licenseCol = licensesCollection(firestore);
      if (values.surplusLinesProducerOfRecord) {
        await checkForSLProducerLicense(
          licenseCol,
          values.state,
          values.effectiveDate,
          values.expirationDate
        );
        const q = query(
          licenseCol,
          where('state', '==', values.state),
          where('surplusLinesProducerOfRecord', '==', true)
        );

        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          let data = querySnap.docs[0].data();
          if (
            !data.expirationDate ||
            data.expirationDate.toMillis() > values.effectiveDate.getTime()
          )
            throw new Error(`Surplus Lines Producer of Record already exists for ${values.state}`);
        }
      }

      const docRef = doc(licenseCol, licenseId);

      await setDoc(
        docRef,
        {
          ...values,
          ownerType: values.ownerType as LicenseOwner,
          licenseType: values.licenseType as LicenseType,
          effectiveDate: Timestamp.fromDate(values.effectiveDate),
          expirationDate: values.expirationDate ? Timestamp.fromDate(values.expirationDate) : null, // @ts-ignore
          'metadata.updated': Timestamp.now(),
        },
        { merge: true }
      );
    },
    [firestore, licenseId]
  );

  const handleSubmit = useCallback(
    async (values: LicenseValues, { setSubmitting }: FormikHelpers<LicenseValues>) => {
      try {
        toast.loading('saving...');
        await updateLicense(values);

        setSubmitting(false);
        toast.success('license updated!');
        navigate(createPath({ path: ADMIN_ROUTES.SL_LICENSES }));
      } catch (err: any) {
        let msg = 'Error updating license';
        if (err.message) msg = `Error: ${err.message}`;

        toast.error(msg);
      }
    },
    [updateLicense, navigate, toast]
  );

  if (!data)
    return <Typography align='center'>{`License not found with ID ${licenseId}`}</Typography>;

  return (
    <Box>
      <LicenseForm
        onSubmit={handleSubmit}
        title={<Typography variant='h5'>Edit License</Typography>}
        initialValues={{
          state: data?.state || '',
          ownerType: data?.ownerType || '',
          licensee: data?.licensee || '',
          licenseType: data?.licenseType || '',
          licenseNumber: data?.licenseNumber || '',
          effectiveDate: data?.effectiveDate?.toDate() || null,
          expirationDate: data?.expirationDate?.toDate() || null,
          surplusLinesProducerOfRecord: data?.surplusLinesProducerOfRecord || false,
          SLAssociationMembershipRequired: data?.SLAssociationMembershipRequired || false,
          address: data?.address || {
            addressLine1: '',
            addressLine2: '',
            city: '',
            state: '',
            postal: '',
          },
          phone: data?.phone || '',
        }}
      />
    </Box>
  );
};
