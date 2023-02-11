import React, { useCallback, useRef, useState } from 'react';
import { Box, Button, Card, Chip, Divider, Typography, useTheme } from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { Formik, FormikHelpers, FormikProps } from 'formik';
import { GeoJsonLayer, PickingInfo } from 'deck.gl/typed';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import * as yup from 'yup';

import { FormikDatePicker, FormikSelect } from 'components/forms';
import { useCreateMoratorium } from 'hooks';
import { ADMIN_ROUTES, createPath } from 'router';
import { FIPSAutocomplete } from 'components/forms/FIPSAutocomplete';
import { FIPSDetails } from 'common';
import { DeckMap, defaultGeoJsonLayerProps } from 'elements';
import { FIPS } from 'common/fips';
import countiesData from 'assets/counties_20m.json';

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
  const theme = useTheme();
  const formikRef = useRef<FormikProps<MoratoriumValues>>(null);
  const [hoverInfo, setHoverInfo] = useState<PickingInfo>();
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
                />
              </Grid>
              <Grid xs={12}>
                <Box sx={{ py: 10, height: 500, width: '100%', mb: 20 }}>
                  <Card sx={{ height: 'inherit', width: 'inherit' }}>
                    <DeckMap
                      hoverInfo={hoverInfo}
                      renderTooltipContent={(info: PickingInfo) =>
                        `${info.object.properties?.NAME} (${info.object.properties?.GEOID})`
                      }
                      layers={[
                        new GeoJsonLayer({
                          ...defaultGeoJsonLayerProps,
                          id: `geojson-layer-counties`, // @ts-ignore
                          data: countiesData,
                          highlightColor:
                            theme.palette.mode === 'dark'
                              ? [255, 255, 255, 25]
                              : [80, 144, 211, 20],
                          getLineColor:
                            theme.palette.mode === 'dark'
                              ? [255, 255, 255, 200]
                              : [178, 186, 194, 200],
                          getFillColor: (f) =>
                            !!values.locationDetails.some(
                              (c: FIPSDetails) =>
                                `${c.stateFP}${c.countyFP}` === f.properties?.GEOID
                            )
                              ? [0, 125, 255, 50]
                              : [255, 255, 255, 20],
                          updateTriggers: {
                            getFillColor: [values.locationDetails],
                          },
                          onHover: (info: PickingInfo) => setHoverInfo(info),
                          onClick: handleCountyClicked,
                        }),
                      ]}
                    />
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
