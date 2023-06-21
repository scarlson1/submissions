import React, { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { FormikHelpers } from 'formik';
import { useNavigate } from 'react-router-dom';

import { useAsyncToast, useCreateSLLicense } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';
import { LicenseForm, LicenseValues } from 'elements';

export const LicenseNew: React.FC = () => {
  const navigate = useNavigate();
  const toast = useAsyncToast({ position: 'top-right' });
  const createLicense = useCreateSLLicense({
    onSuccess: (id: string) => {
      toast.success(`License created (${id})`);
      navigate(createPath({ path: ADMIN_ROUTES.SL_LICENSES }));
    },
    onError: (err, msg) => toast.error(msg),
  });

  const handleSubmit = useCallback(
    async (values: LicenseValues, { setSubmitting }: FormikHelpers<LicenseValues>) => {
      toast.loading('saving...');
      await createLicense(values);
      setSubmitting(false);
    },
    [createLicense, toast]
  );

  return (
    <Box>
      <LicenseForm
        onSubmit={handleSubmit}
        title={<Typography variant='h5'>Create License</Typography>}
      />
    </Box>
  );
};
