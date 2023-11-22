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
import { Form, Formik, FormikConfig, FormikProps } from 'formik';
import { upperFirst } from 'lodash';
import { useCallback, useRef, useState } from 'react';
import { Map, Marker } from 'react-map-gl';

import { DEFAULT_ADDRESS_FIELD_NAMES, Organization } from 'common';
import { MAPBOX_DARK, MAPBOX_LIGHT } from 'components';
import { FormikNativeSelect, FormikTextField } from 'components/forms';
import { FormattedAddress } from 'elements/FormattedAddress';
import { FormikAddress } from 'elements/forms';
import { commOptions } from 'elements/forms/QuoteForm/constants';
import { MAPBOX_TOKEN } from 'elements/maps';
import { useAsyncToast, useClaims, useDocData, useUpdateOrg } from 'hooks';

// TODO: primary contact, NPN, FEIN ??
// move component state up to EditOrg component ?? same except for form

export const OrgDetails = () => {
  const { orgId } = useClaims();
  if (!orgId) throw new Error('missing org ID');

  const toast = useAsyncToast({ position: 'top-right' });
  const { data: org } = useDocData('organizations', orgId);
  const [editMode, setEditMode] = useState(false);
  const formRef = useRef<FormikProps<OrgValues>>(null);

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

  const handleUpdateOrg = useCallback((values: OrgValues) => updateOrg(values), [updateOrg]);

  const saveDisabled = !formRef.current?.dirty || !formRef.current?.isValid;
  const saveLoading = formRef.current?.isValidating || formRef.current?.isSubmitting;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant='subtitle1' sx={{ flex: '1 1 auto' }}>
          Organization
        </Typography>
        <Box>
          <Stack direction='row' spacing={2}>
            {editMode ? (
              <LoadingButton
                onClick={() => formRef.current?.submitForm()}
                loading={saveLoading}
                disabled={saveDisabled}
                size='small'
                variant='contained'
                sx={{ maxHeight: 34 }}
              >
                save
              </LoadingButton>
            ) : null}
            <IconButton
              onClick={() => {
                editMode && formRef.current?.resetForm();
                setEditMode((m) => !m);
              }}
              size='small'
              color='primary'
              aria-label={editMode ? 'cancel' : 'edit'}
            >
              {editMode ? <CloseRounded fontSize='inherit' /> : <EditRounded fontSize='inherit' />}
            </IconButton>
          </Stack>
        </Box>
      </Box>
      {editMode ? (
        <EditOrgForm
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
          innerRef={formRef}
        />
      ) : (
        <>
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

type OrgValues = Pick<Organization, 'orgName' | 'address' | 'defaultCommission'>;

interface EditOrgFormProps extends FormikConfig<OrgValues> {}

function EditOrgForm(props: EditOrgFormProps) {
  return (
    <Formik {...props}>
      {({ handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <Box sx={{ py: 4 }}>
            {/* <Typography variant='overline' sx={{ lineHeight: 2 }}>
              Organization Name
            </Typography> */}
            <FormikTextField name='orgName' label='Org Name' fullWidth />
          </Box>
          <Divider />
          <Box sx={{ py: 4 }}>
            {/* <Typography variant='overline'>Address</Typography> */}
            <FormikAddress names={DEFAULT_ADDRESS_FIELD_NAMES} />
          </Box>
          <Divider />
          <Box sx={{ py: 4 }}>
            {/* <Typography variant='overline'>Default Commissions</Typography> */}
            <Box>
              {/* TODO: use slider ?? */}
              <FormikNativeSelect
                name='defaultCommission.flood'
                label='Default Flood Commission'
                selectOptions={commOptions}
                convertToNumber={true}
                // sx={{ mt: 3 }}
              />
            </Box>
          </Box>
        </Form>
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
