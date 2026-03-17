import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Chip,
  Divider,
  Unstable_Grid2 as Grid,
  Typography,
} from '@mui/material';
import { PickingInfo } from 'deck.gl';
import { Form, Formik, FormikConfig, FormikProps } from 'formik';
import { Suspense, useCallback, useMemo, useRef } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import toast from 'react-hot-toast';
import { array, date, object, string } from 'yup';

import { FIPSDetails } from 'common';
import { ErrorFallback } from 'components';
import {
  FormikDatePicker,
  FormikSelect,
  VirtualizedAutocomplete,
} from 'components/forms';
import { CountiesMap } from 'elements/maps';
import { useDocDataOnce } from 'hooks';
import { getDateShortcutsWeeks } from 'modules/utils';

const expirationDateShortcuts = getDateShortcutsWeeks([1, 2, 4, 8]);

const validation = object().shape({
  locationDetails: array()
    .of(
      object({
        state: string().required(),
        stateFP: string().required(),
        countyName: string().required(),
        countyFP: string().required(),
        classFP: string(),
      }),
    )
    .required('must select at least one county'),
  effectiveDate: date().required(),
  expirationDate: date().required(),
  product: array().of(string()).required(),
  reason: string().required(),
});

export interface MoratoriumValues {
  locationDetails: FIPSDetails[];
  effectiveDate: Date;
  expirationDate: Date | null;
  product: string[];
  reason: string;
}

export interface MoratoriumFormProps extends Omit<
  FormikConfig<MoratoriumValues>,
  'innerRef'
> {
  title: string;
}

export const MoratoriumForm = ({ title, ...props }: MoratoriumFormProps) => {
  const formikRef = useRef<FormikProps<MoratoriumValues>>(null);
  const { data } = useDocDataOnce<{ counties: FIPSDetails[] }>(
    'public',
    'fips',
  );
  const counties = useMemo(() => data?.counties || [], [data]);
  // TODO: handle doc doesn't exist ? does suspense catch does not exist ?

  const handleRemoveChip = useCallback(
    (field: string, fieldVal: any[], removeVal: any) => (e: any) => {
      e.stopPropagation();
      formikRef.current?.setFieldValue(
        field,
        fieldVal.filter((v) => v !== removeVal),
      );
    },
    [],
  );

  const handleCountyClicked = useCallback(
    (info: PickingInfo, e: any) => {
      const fips = info.object.properties.GEOID;
      if (!fips) return;

      if (
        // Already in array, remove from list
        formikRef.current?.values.locationDetails.some(
          (c) => `${c.stateFP}${c.countyFP}` === fips,
        )
      ) {
        const newArr = formikRef.current?.values.locationDetails.filter(
          (c) => `${c.stateFP}${c.countyFP}` !== fips,
        );
        formikRef.current?.setFieldValue('locationDetails', newArr);
      } else {
        // TODO: get county details with api ??
        const details = counties.find(
          (e) => `${e.stateFP}${e.countyFP}` === fips,
        );
        if (!details)
          return toast.error(`Unable to match county details for ${fips}`);

        formikRef.current?.setFieldValue('locationDetails', [
          ...formikRef.current?.values.locationDetails,
          details,
        ]);
      }
    },
    [counties],
  );

  return (
    <Box>
      <Formik validationSchema={validation} innerRef={formikRef} {...props}>
        {({
          dirty,
          isValid,
          isSubmitting,
          isValidating,
          values,
          handleSubmit,
          submitForm,
        }) => (
          <Form onSubmit={handleSubmit}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='h5' sx={{ ml: 4 }}>
                {title}
              </Typography>
              <LoadingButton
                variant='contained'
                onClick={submitForm}
                disabled={!dirty || !isValid}
                loading={isSubmitting || isValidating}
              >
                Save
              </LoadingButton>
            </Box>
            <Divider sx={{ my: 2 }} />

            <Grid container spacing={8} sx={{ my: 4 }}>
              <Grid xs={12} md={6}>
                <VirtualizedAutocomplete
                  options={counties}
                  name='locationDetails'
                  getOptionLabel={(option) =>
                    `${option.stateFP}${option.countyFP} - ${option.countyName}`
                  }
                  autocompleteProps={{
                    // loading: status === 'loading',
                    multiple: true,
                    groupBy: (option) => option.state,
                  }}
                  textFieldProps={{
                    label: 'Counties',
                    placeholder: 'search: fips, state, county name',
                    required: true,
                  }}
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FormikSelect
                  name='reason'
                  label='Reason'
                  selectOptions={['capacity', 'event']}
                  fullWidth
                  required
                />
              </Grid>
              <Grid xs={12} sm={6} md={3}>
                <FormikSelect
                  name='product'
                  label='Product(s)'
                  selectOptions={['flood', 'wind']}
                  fullWidth
                  required
                  multiple // @ts-ignore
                  renderValue={(selected: string[]) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value: string) => (
                        <Chip
                          key={value}
                          label={value}
                          size='small'
                          onDelete={handleRemoveChip(
                            'product',
                            values.product,
                            value,
                          )}
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
                  slotProps={{
                    textField: {
                      required: true,
                    },
                  }}
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
                      items: expirationDateShortcuts,
                    },
                    textField: {
                      required: true,
                    },
                  }}
                />
              </Grid>
            </Grid>
            <Grid xs={12}>
              <Box sx={{ py: 10, height: 500, width: '100%', mb: 20 }}>
                <Card sx={{ height: 'inherit', width: 'inherit' }}>
                  <ErrorBoundary FallbackComponent={ErrorFallback}>
                    <Suspense
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
                          getFillColor: (f: any) =>
                            !!values.locationDetails?.some(
                              (c: FIPSDetails) =>
                                `${c.stateFP}${c.countyFP}` ===
                                f.properties?.GEOID,
                            )
                              ? [0, 125, 255, 50]
                              : [255, 255, 255, 20],
                        }}
                      />
                    </Suspense>
                  </ErrorBoundary>
                </Card>
              </Box>
            </Grid>
          </Form>
        )}
      </Formik>
    </Box>
  );
};
