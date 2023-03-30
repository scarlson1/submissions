import React, { Suspense, useCallback, useRef } from 'react';
import { Box, Button, Card, CircularProgress, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { useParams } from 'react-router-dom';
import { doc, setDoc, getFirestore } from 'firebase/firestore';
import { PickingInfo } from 'deck.gl/typed';
import { capitalize } from 'lodash';
import { SaveRounded } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { ErrorBoundary } from 'react-error-boundary';

import { statesDetailsArr } from 'common/statesList';
import { FormikSwitch } from 'components/forms';
import { statesCollection } from 'common';
import { ActiveStateMap } from 'elements/ActiveStateMap';
import { useDocData } from 'hooks';
import { ErrorFallback } from 'components';

export interface EditActiveStatesValues {
  [key: string]: boolean;
}

export const EditActiveStates: React.FC = () => {
  let { productId } = useParams();
  const { data, status } = useDocData<{ [key: string]: boolean }>('ACTIVE_STATES', productId || '');
  const formikRef = useRef<FormikProps<EditActiveStatesValues>>(null);

  const handleSave = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  const handleSubmit = useCallback(
    async (values: any, { setSubmitting }: FormikHelpers<any>) => {
      console.log('values: ', values);
      try {
        if (!productId) throw new Error('Missing doc Id');

        const docRef = doc(statesCollection(getFirestore()), productId);
        await setDoc(docRef, { ...values }, { merge: true });

        toast.success('Saved!');
      } catch (err) {
        console.log('ERROR: ', err);
        toast.error('Error saving');
      }

      setSubmitting(false);
    },
    [productId]
  );

  const handleStateClicked = useCallback((info: PickingInfo, e: any) => {
    const key = info.object.properties.SHORT_NAME;
    if (!key) return;
    const currVal = formikRef.current?.values[key];
    formikRef.current?.setFieldValue(key, !currVal);
  }, []);

  if (status === 'loading') return <div>Loading...</div>;

  return (
    <Box>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: (theme) => theme.palette.background.default,
          // backdropFilter: 'blur(20px)',
          // webkitBackdropFilter: 'blur(20px)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            pt: 2,
            pb: 1,
            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant='h5' gutterBottom>
            {`Edit Active States - ${capitalize(productId)}`}
          </Typography>
          <Button
            variant='contained'
            startIcon={<SaveRounded fontSize='small' />}
            onClick={handleSave}
            size='small'
            sx={{ maxHeight: 36 }}
          >
            Save
          </Button>
        </Box>
      </Box>
      <Box sx={{ py: { xs: 4, md: 6, lg: 8 } }}>
        <Formik
          initialValues={{
            AL: false,
            AK: false,
            AZ: false,
            AR: false,
            CA: false,
            CO: false,
            CT: false,
            DE: false,
            DC: false,
            FL: false,
            GA: false,
            HI: false,
            ID: false,
            IL: false,
            IN: false,
            IA: false,
            KS: false,
            KY: false,
            LA: false,
            ME: false,
            MD: false,
            MA: false,
            MI: false,
            MN: false,
            MS: false,
            MO: false,
            MT: false,
            NE: false,
            NV: false,
            NH: false,
            NJ: false,
            NM: false,
            NY: false,
            NC: false,
            ND: false,
            OH: false,
            OK: false,
            OR: false,
            PA: false,
            RI: false,
            SC: false,
            SD: false,
            TN: false,
            TX: false,
            UT: false,
            VT: false,
            VA: false,
            WA: false,
            WV: false,
            WI: false,
            WY: false,
            ...data,
          }}
          onSubmit={handleSubmit}
          enableReinitialize
          innerRef={formikRef}
        >
          {({ values }) => (
            <Grid container rowSpacing={4} columnSpacing={6} sx={{ maxWidth: '100%', mx: 'auto' }}>
              {statesDetailsArr.map((s) => (
                <Grid xs={6} sm={4} md={3} lg={2} key={s.name}>
                  <FormikSwitch
                    name={s.abbreviation}
                    label={s.name}
                    formControlLabelProps={{
                      componentsProps: { typography: { variant: 'body2', px: 2 } },
                    }}
                  />
                </Grid>
              ))}
              <Grid xs={12}>
                <Box sx={{ py: 10, height: 500, width: '100%', mb: 20 }}>
                  <ErrorBoundary
                    FallbackComponent={ErrorFallback}
                    onReset={() => (productId = 'flood')}
                    resetKeys={[productId]}
                  >
                    <Suspense fallback={<CircularProgress color='secondary' />}>
                      <Card sx={{ height: 'inherit', width: 'inherit' }}>
                        <ActiveStateMap handleClick={handleStateClicked} statesValues={values} />
                      </Card>
                    </Suspense>
                  </ErrorBoundary>
                </Box>
              </Grid>
            </Grid>
          )}
        </Formik>
      </Box>
    </Box>
  );
};
