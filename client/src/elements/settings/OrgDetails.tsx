import { CloseRounded, EditRounded, PlaceRounded } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import {
  Box,
  Card,
  Divider,
  Unstable_Grid2 as Grid,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { GeoPoint } from 'firebase/firestore';
import { Form, Formik, FormikConfig } from 'formik';
import { upperFirst } from 'lodash';
import { useCallback, useState } from 'react';
import { Map, Marker } from 'react-map-gl';

import { NESTED_ADDRESS_FIELD_NAMES, Organization, Product } from 'common';
import { MAPBOX_DARK, MAPBOX_LIGHT } from 'components';
import { FormikNativeSelect, FormikTextField } from 'components/forms';
import { FormattedAddress } from 'elements/FormattedAddress';
import { FormikAddress } from 'elements/forms';
import { commOptions } from 'elements/forms/QuoteForm/constants';
import { MAPBOX_TOKEN } from 'elements/maps';
import { useAsyncToast, useClaims, useDocData, useUpdateOrg } from 'hooks';

// TODO: primary contact, NPN, FEIN ??
// move component state up to EditOrg component ?? same except for form (just pass onSubmit)

export const OrgDetails = () => {
  const { orgId } = useClaims();
  if (!orgId) throw new Error('missing org ID');

  const [editMode, setEditMode] = useState(false);
  const { data: org } = useDocData('organizations', orgId);
  const toast = useAsyncToast({ position: 'top-right' });
  // const formRef = useRef<FormikProps<OrgValues>>(null);

  const updateOrg = useUpdateOrg(
    orgId,
    () => {
      toast.success('org changes saved');
      setEditMode(false);
    },
    (msg) => {
      toast.error(msg);
    }
  );

  const handleUpdateOrg = useCallback(
    (values: OrgValues) => {
      const { latitude, longitude } = values.coordinates || {};
      const coordinates = latitude && longitude ? new GeoPoint(latitude, longitude) : null;
      return updateOrg({ ...values, coordinates });
    },
    [updateOrg]
  );

  return (
    <Box>
      {editMode ? (
        <EditOrgForm
          exitEditMode={() => setEditMode(false)}
          initialValues={{
            orgName: org?.orgName || '',
            address: {
              addressLine1: org?.address?.addressLine1 ?? '',
              addressLine2: org?.address?.addressLine2 ?? '',
              city: org?.address?.city ?? '',
              state: org?.address?.state ?? '',
              postal: org?.address?.postal ?? '',
            },
            defaultCommission: {
              flood: org?.defaultCommission?.flood ?? 0.15,
              wind: org?.defaultCommission?.wind ?? 0.15,
            },
          }}
          onSubmit={handleUpdateOrg}
          // innerRef={formRef}
        />
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='subtitle1' sx={{ flex: '1 1 auto' }}>
              Organization
            </Typography>
            <Box>
              <Stack direction='row' spacing={2}>
                <IconButton
                  onClick={() => {
                    // editMode && formRef.current?.resetForm();
                    setEditMode((m) => !m);
                  }}
                  size='small'
                  color='primary'
                  aria-label='edit'
                >
                  <EditRounded fontSize='inherit' />
                </IconButton>
              </Stack>
            </Box>
          </Box>
          <Grid container spacing={4} sx={{ my: 4 }}>
            {/* <Typography variant='overline'>Organization</Typography> */}
            <Grid xs={12} sm={6}>
              <Typography variant='body1' gutterBottom fontSize={18}>
                {org?.orgName || ''}
              </Typography>
              <FormattedAddress address={org?.address} variant='body2' color='text.secondary' />
              <Divider sx={{ my: 3 }} />
              <Box sx={{ pb: 2 }}>
                <Typography variant='overline'>Default Commissions</Typography>
              </Box>
              {org?.defaultCommission ? (
                <>
                  {Object.entries(org.defaultCommission).map(([k, v]) => (
                    <Typography variant='body2' color='text.secondary' key={k}>{`${upperFirst(
                      k
                    )}: ${(typeof v === 'number' ? v : 0.15) * 100}%`}</Typography>
                  ))}
                </>
              ) : (
                <Typography variant='body2' color='text.secondary'>{`Flood: ${
                  (org?.defaultCommission?.flood || 0.15) * 100
                }%`}</Typography>
              )}
            </Grid>
            <Grid xs={12} sm={6}>
              {org?.coordinates ? (
                <Card sx={{ height: 240 }}>
                  <OrgMap coordinates={org?.coordinates} />
                </Card>
              ) : null}
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

type OrgValues = Pick<Organization, 'orgName' | 'address' | 'defaultCommission' | 'coordinates'>;

interface EditOrgFormProps extends FormikConfig<OrgValues> {
  exitEditMode: () => void;
}

function EditOrgForm({ exitEditMode, ...props }: EditOrgFormProps) {
  return (
    <Formik {...props}>
      {({ isSubmitting, isValidating, isValid, dirty, handleSubmit, submitForm, resetForm }) => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='subtitle1' sx={{ flex: '1 1 auto' }}>
              Organization
            </Typography>
            <Box>
              <Stack direction='row' spacing={2}>
                <LoadingButton
                  onClick={submitForm}
                  loading={isSubmitting || isValidating}
                  disabled={!dirty || !isValid}
                  size='small'
                  variant='contained'
                  sx={{ maxHeight: 34 }}
                >
                  save
                </LoadingButton>

                <IconButton
                  onClick={() => {
                    resetForm();
                    exitEditMode();
                  }}
                  size='small'
                  color='primary'
                  aria-label='cancel'
                >
                  <CloseRounded fontSize='inherit' />
                </IconButton>
              </Stack>
            </Box>
          </Box>
          <Form onSubmit={handleSubmit}>
            <Box sx={{ py: 4 }}>
              <FormikTextField name='orgName' label='Org Name' fullWidth />
            </Box>
            <Divider />
            <Box sx={{ py: 4 }}>
              <FormikAddress
                names={NESTED_ADDRESS_FIELD_NAMES}
                autocompleteProps={{
                  name: 'address.addressLine1',
                }}
              />
            </Box>
            <Divider />
            <Grid container spacing={4} sx={{ py: 4 }}>
              {/* TODO: use slider ?? */}
              <Grid xs={12} sm={6}>
                <FormikNativeSelect
                  name={`defaultCommission.${Product.Enum.flood}`}
                  label='Default Flood Commission'
                  selectOptions={commOptions}
                  convertToNumber={true}
                />
              </Grid>
              <Grid xs={12} sm={6}>
                <FormikNativeSelect
                  name={`defaultCommission.${Product.Enum.wind}`}
                  label='Default Wind Commission'
                  selectOptions={commOptions}
                  convertToNumber={true}
                />
              </Grid>
            </Grid>
          </Form>
        </>
      )}
    </Formik>
  );
}

function OrgMap({ coordinates }: { coordinates: Organization['coordinates'] }) {
  const theme = useTheme();
  return (
    <Map
      initialViewState={{
        longitude: coordinates?.longitude || -94.25,
        latitude: coordinates?.latitude || 38.25,
        zoom: coordinates?.latitude && coordinates?.longitude ? 16 : 2.5,
      }}
      mapboxAccessToken={MAPBOX_TOKEN}
      style={{ width: '100%', height: '100%' }}
      mapStyle={theme.palette.mode === 'dark' ? MAPBOX_DARK : MAPBOX_LIGHT}
      // projection={{ name: 'mercator' }}
    >
      {coordinates?.latitude && coordinates.longitude ? (
        <Marker
          latitude={coordinates.latitude}
          longitude={coordinates.longitude}
          anchor='center'
          style={{ height: '24px', width: '24px' }} // default marker: height of 41px and a width of 27px
        >
          <PlaceRounded color='primary' />
          {/* <GpsFixedRounded color='primary' /> */}
        </Marker>
      ) : null}
    </Map>
  );
}
