import React, { useCallback, useRef } from 'react';
import { Box, Button, Card, Chip, Divider, Typography } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { PickingInfo } from 'deck.gl/typed';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';
import { addWeeks } from 'date-fns';

import { FormikDatePicker, FormikSelect } from 'components/forms';
import { useCreateMoratorium } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';
import { FIPSAutocomplete } from 'components/forms/FIPSAutocomplete';
import { FIPSDetails } from 'common';
import { FIPS } from 'common/fips';
import { CountiesMap } from './Moratoriums';

const validation = yup.object().shape({
  locationDetails: yup
    .array()
    .of(
      yup.object({
        state: yup.string().required(),
        stateFP: yup.string().required(),
        countyName: yup.string().required(),
        countyFP: yup.string().required(),
        classFP: yup.string(),
      })
    )
    .required('must select at least one county'),
  effectiveDate: yup.date().required(),
  expirationDate: yup.date().required(),
  product: yup.array().of(yup.string()).required(),
  reason: yup.string().required(),
});

export interface MoratoriumValues {
  locationDetails: FIPSDetails[];
  effectiveDate: Date;
  expirationDate: Date | null;
  product: string[];
  reason: string;
}

export const MoratoriumNew: React.FC = () => {
  const navigate = useNavigate();
  const formikRef = useRef<FormikProps<MoratoriumValues>>(null);
  const createMoratorium = useCreateMoratorium({
    onSuccess: (id: string) => {
      toast.success(`Moratorium created (ID: ${id})`);
      navigate(createPath({ path: ADMIN_ROUTES.MORATORIUMS }));
    },
    onError: (err: unknown, msg: string) => toast.error(msg),
  });

  const submitForm = useCallback(() => {
    formikRef.current?.submitForm();
  }, []);

  const handleSubmit = useCallback(
    async (values: MoratoriumValues, { setSubmitting }: FormikHelpers<MoratoriumValues>) => {
      await createMoratorium(values);
      setSubmitting(false);
    },
    [createMoratorium]
  );

  const handleRemoveChip = (field: string, fieldVal: any[], removeVal: any) => (e: any) => {
    e.stopPropagation();
    formikRef.current?.setFieldValue(
      field,
      fieldVal.filter((v) => v !== removeVal)
    );
  };

  const handleCountyClicked = useCallback((info: PickingInfo, e: any) => {
    const fips = info.object.properties.GEOID;
    if (!fips) return;

    if (
      formikRef.current?.values.locationDetails.some((c) => `${c.stateFP}${c.countyFP}` === fips)
    ) {
      const newArr = formikRef.current?.values.locationDetails.filter(
        (c) => `${c.stateFP}${c.countyFP}` !== fips
      );
      formikRef.current?.setFieldValue('locationDetails', newArr);
    } else {
      // TODO: get county details by fips (pass fips data to autocomplete component so not importing two places ??)
      const details = FIPS.find((e) => `${e.stateFP}${e.countyFP}` === fips);
      if (!details) return;

      formikRef.current?.setFieldValue('locationDetails', [
        ...formikRef.current?.values.locationDetails,
        details,
      ]);
    }
  }, []);

  return (
    <Box>
      <Formik
        initialValues={{
          locationDetails: [],
          effectiveDate: new Date(),
          expirationDate: null,
          product: ['flood'],
          reason: '',
        }}
        validation={validation}
        onSubmit={handleSubmit}
        innerRef={formikRef}
      >
        {({ dirty, isValid, isSubmitting, isValidating, values }) => (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant='h5' gutterBottom sx={{ ml: 4 }}>
                New Moratorium
              </Typography>
              <Button
                onClick={submitForm}
                disabled={!dirty || !isValid || isSubmitting || isValidating}
              >
                Submit
              </Button>
            </Box>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={8} sx={{ my: 4 }}>
              <Grid xs={12} md={6}>
                <FIPSAutocomplete name='locationDetails' />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FormikSelect
                  name='reason'
                  label='Reason'
                  selectOptions={['capacity', 'event']}
                  fullWidth
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FormikSelect
                  name='product'
                  label='Product(s)'
                  selectOptions={['flood', 'wind']}
                  fullWidth
                  multiple // @ts-ignore
                  renderValue={(selected: string[]) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value: string) => (
                        <Chip
                          key={value}
                          label={value}
                          size='small'
                          onDelete={handleRemoveChip('product', values.product, value)}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ))}
                    </Box>
                  )}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FormikDatePicker
                  name='effectiveDate'
                  label='Effective Date'
                  minDate={undefined}
                  maxDate={null}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FormikDatePicker
                  name='expirationDate'
                  label='Expiration Date'
                  minDate={undefined}
                  maxDate={null}
                  slotProps={{
                    shortcuts: {
                      items: [
                        {
                          label: '1 week',
                          getValue: () => {
                            return addWeeks(new Date(), 1);
                          },
                        },
                        {
                          label: '2 weeks',
                          getValue: () => {
                            return addWeeks(new Date(), 2);
                          },
                        },
                        {
                          label: '4 weeks',
                          getValue: () => {
                            return addWeeks(new Date(), 4);
                          },
                        },
                        {
                          label: '8 weeks',
                          getValue: () => {
                            return addWeeks(new Date(), 8);
                          },
                        },
                      ],
                    },
                  }}
                />
              </Grid>
              <Grid xs={12}>
                <Box sx={{ py: 10, height: 500, width: '100%', mb: 20 }}>
                  <Card sx={{ height: 'inherit', width: 'inherit' }}>
                    <React.Suspense
                      fallback={
                        <Typography align='center' sx={{ py: 5 }}>
                          Loading counties...
                        </Typography>
                      }
                    >
                      <CountiesMap
                        selectedCounties={values.locationDetails}
                        layerProps={{
                          onClick: handleCountyClicked,
                        }}
                      />
                    </React.Suspense>
                  </Card>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </Formik>
    </Box>
  );
};
