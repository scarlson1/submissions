import {
  AccountBalanceRounded,
  AddRounded,
  ExpandMoreRounded,
  PersonAddAltRounded,
  PersonRounded,
} from '@mui/icons-material';
import {
  Avatar,
  AvatarGroup,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardMediaProps,
  Collapse,
  Container,
  Unstable_Grid2 as Grid,
  Tooltip,
  Typography,
} from '@mui/material';
import { Form, Formik, useFormikContext } from 'formik';
import { useCallback, useMemo, useState } from 'react';
import { useFunctions } from 'reactfire';
import { object, string } from 'yup';

import type { Address } from '@idemand/common';
import { calcTotalsByBillingEntity } from 'api';
import {
  AdditionalInterest,
  additionalInterestsVal,
  fallbackImages,
  NamedInsuredDetails,
  Quote,
  TCollection,
} from 'common';
import {
  FormikFieldArray,
  FormikNativeSelect,
  FormikWizardNavButtons,
} from 'components/forms';
import { SelectOption } from 'components/forms/FormikSelect';
import { ExpandMoreButton } from 'elements/cards/ExpandMoreButton';
import { useDocData, useWizard } from 'hooks';
import { AddBillingEntity } from './AddBillingEntity';
import { BindQuoteProps } from './NamedInsuredStep';

// list locations
// add billing entity button
//    - open dialog to create new stripe user ??
// list all locations (cards ??)
//    - select dropdown for billing entity
//    - add additional insured button that opens collapse to add additional insured ??
//        - or dialog ?? b/c eventually will be stored in locations collection docs

const locationBillingVal = object().shape({
  defaultBillingEntityId: string().required('required'),
  additionalInterests: additionalInterestsVal,
});

export interface BillingEntityStepValues {
  defaultBillingEntityId: string;
  additionalInterests: AdditionalInterest[];
}

interface LocationBillingStepProps extends BindQuoteProps<BillingEntityStepValues> {
  colName: TCollection;
  docId: string;
  // temporary props for single location quote schema
  address: Address;
  img: CardMediaProps['image'];
}

// when refactoring to multi-location:
//    - additional interests stored in location doc
//    - field value: locations.lcnId.billingEntityId
//    - virtualize cards
//    - lazy load additional insureds (locations) / use react query ??

export const LocationBillingStep = ({
  colName,
  docId,
  address,
  img,
  formRef,
  onStepSubmit,
}: LocationBillingStepProps) => {
  const functions = useFunctions();
  const { nextStep } = useWizard();
  // TODO: fix type instead of Pick<Quote>
  // pass options & additional interest getter fn --> useMemo to return options & AI ??
  const { data } = useDocData<
    Pick<
      Quote,
      | 'namedInsured'
      | 'billingEntities'
      | 'defaultBillingEntityId'
      | 'additionalInterests'
    >
  >(colName, docId);

  const billingEntityOptions = useMemo(
    () =>
      Object.entries(data?.billingEntities || {}).map(([cusId, details]) => ({
        value: cusId,
        label: `${details.displayName || ''} (${details.email})`,
        ...details,
      })),
    [data],
  );

  const handleUpdateValues = useCallback(
    async (values: BillingEntityStepValues) => {
      await onStepSubmit({
        defaultBillingEntityId: values.defaultBillingEntityId,
        additionalInterests: values.additionalInterests,
      });

      // TODO: move to onStepSubmit ?? make component more reusable / separate view from js
      const { data } = await calcTotalsByBillingEntity(functions, {
        collection: colName,
        docId,
      });
      console.log('billing entity res: ', data);
    },
    [nextStep, functions, colName, docId],
  );

  // pass to handleUpdateValues b/c formik doesn't handle multiple async functions properly
  const handleSubmit = useCallback(
    async (values: BillingEntityStepValues) => {
      try {
        // console.log('step values: ', values);
        await handleUpdateValues(values);

        await nextStep();
      } catch (err: any) {
        console.log('err: ', err);
        // TODO onError
      }
    },
    [nextStep, handleUpdateValues],
  );

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 3,
        }}
      >
        <Typography variant='h5'>
          Billing Entity & Additional Insured
        </Typography>
        <AddBillingEntity
          colName={colName}
          docId={docId}
          buttonProps={{
            variant: 'contained',
            size: 'small',
            startIcon: <AddRounded />,
          }}
        />
      </Box>
      <Formik<BillingEntityStepValues>
        initialValues={{
          defaultBillingEntityId: data?.defaultBillingEntityId || '',
          additionalInterests: data?.additionalInterests || [],
        }}
        onSubmit={handleSubmit}
        validationSchema={locationBillingVal}
        innerRef={formRef}
        validateOnMount
        enableReinitialize
      >
        {({ submitForm }) => (
          <Form onSubmit={submitForm}>
            <Container
              maxWidth='sm'
              disableGutters
              sx={{ maxHeight: { xs: 500, sm: 800 }, overflowY: 'auto', py: 5 }}
            >
              <BillingLocationFormCard
                namedInsured={data.namedInsured as NamedInsuredDetails}
                dbAdditionalInterests={data.additionalInterests || []}
                address={address}
                img={img}
                selectOptions={billingEntityOptions}
              />
            </Container>
            <Box sx={{ py: 2 }}>
              <FormikWizardNavButtons onClick={submitForm} />
            </Box>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

interface BillingLocationFormCardProps {
  namedInsured: NamedInsuredDetails;
  dbAdditionalInterests: AdditionalInterest[];
  address: Address;
  img: CardMediaProps['image'];
  selectOptions: SelectOption[];
}

function BillingLocationFormCard({
  namedInsured,
  dbAdditionalInterests,
  address,
  img,
  selectOptions,
}: BillingLocationFormCardProps) {
  const {
    values,
    touched,
    errors,
    dirty,
    setFieldValue,
    setFieldTouched,
    setFieldError,
  } = useFormikContext<BillingEntityStepValues>();
  const [expanded, setExpanded] = useState(false);

  const handleExpandClick = () => {
    // TODO: dont allow collapse if form is invalid (use formik context, check if key included in errors)
    setExpanded(!expanded);
  };

  return (
    <Card>
      <Box sx={{ display: { xs: 'block', sm: 'flex' } }}>
        <CardMedia
          component='img'
          sx={{
            width: { xs: '100%', sm: 140 },
            height: { xs: 120, sm: 'auto' },
          }}
          image={img || fallbackImages[0]}
          alt={`${address.addressLine1}`}
        />
        <CardContent
          sx={{ p: 0, '&.MuiCardContent-root:last-child': { pb: 0 } }}
        >
          <Grid container spacing={4} sx={{ px: 4, pt: 4, pb: 2 }}>
            <Grid xs={7}>
              <Typography component='div' variant='h5'>
                {address?.addressLine1 || 'Missing address'}
              </Typography>
              <Typography
                variant='subtitle2'
                color='text.tertiary'
                component='div'
              >
                {`${address.city}, ${address.state}`}
              </Typography>
            </Grid>
            <Grid xs={5}>
              {selectOptions.length ? (
                <FormikNativeSelect
                  name='defaultBillingEntityId'
                  label='Billing Entity'
                  selectOptions={selectOptions}
                  required
                  variant='standard'
                  fullWidth
                  sx={{ minWidth: 100 }}
                />
              ) : (
                <Typography color='waring.main' variant='subtitle2'>
                  Click add billing entity button above
                </Typography>
              )}
            </Grid>
            <Grid xs={12} sx={{ display: 'flex', alignItems: 'center', pt: 6 }}>
              <AvatarGroup
                max={4}
                spacing='medium'
                sx={{ justifyContent: 'flex-end' }}
              >
                {namedInsured ? (
                  <Tooltip
                    title={`${namedInsured.firstName}`}
                    key={namedInsured.email}
                  >
                    <Avatar
                      src={namedInsured.photoURL || undefined}
                      alt={namedInsured.firstName || 'i d'}
                      sx={{ width: 30, height: 30 }}
                    />
                  </Tooltip>
                ) : null}
                {dbAdditionalInterests?.length
                  ? dbAdditionalInterests.map((f, i) => (
                      <Tooltip title={`${f?.name}`} key={`${f.email}-${i}`}>
                        <Avatar
                          alt={`${f.email}-${i}`}
                          sx={{ width: 30, height: 30 }}
                        >
                          {f.type === 'mortgagee' ? (
                            <AccountBalanceRounded fontSize='inherit' />
                          ) : (
                            <PersonRounded fontSize='inherit' />
                          )}
                        </Avatar>
                      </Tooltip>
                    ))
                  : null}
              </AvatarGroup>
              <ExpandMoreButton
                expand={expanded}
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label='edit additional interests'
                size='small'
                sx={{ ml: 'auto', height: 28, width: 28 }}
                disabled={
                  Boolean(errors) &&
                  Object.keys(errors).includes('additionalInterests')
                }
              >
                <ExpandMoreRounded fontSize='inherit' />
              </ExpandMoreButton>
            </Grid>
          </Grid>
        </CardContent>
      </Box>
      <Collapse
        in={expanded}
        timeout='auto'
        sx={{
          flexBasis: '100%',
          borderTop: (theme) =>
            expanded ? `1px solid ${theme.palette.divider}` : undefined,
        }}
      >
        <CardContent>
          <Typography variant='subtitle1' gutterBottom>
            Additional Interests
          </Typography>
          <FormikFieldArray
            parentField='additionalInterests'
            inputFields={[
              {
                name: 'type',
                label: 'Interest Type',
                required: false,
                inputType: 'select',
                selectOptions: [
                  { label: 'Mortgagee', value: 'mortgagee' },
                  { label: 'Additional Insured', value: 'additional_insured' },
                ],
                variant: 'standard',
                propsGetterFunc: () => ({
                  sx: {
                    minWidth: 100,
                  },
                }),
              },
              {
                name: 'name',
                label: 'Name',
                required: false,
                inputType: 'text',
                variant: 'standard',
              },
              {
                name: 'accountNumber',
                label: 'Account Number',
                required: false,
                inputType: 'text',
                helperText: 'loan number (optional)',
                variant: 'standard',
              },
              {
                name: 'address.addressLine1',
                label: 'Mailing Address',
                required: false,
                inputType: 'address',
                propsGetterFunc: (index, parentField) => {
                  return {
                    names: {
                      addressLine1: `${parentField}[${index}].address.addressLine1`,
                      addressLine2: `${parentField}[${index}].address.addressLine2`,
                      city: `${parentField}[${index}].address.city`,
                      state: `${parentField}[${index}].address.state`,
                      postal: `${parentField}[${index}].address.postal`,
                      county: `${parentField}[${index}].address.countyName`,
                      // latitude: `${parentField}[${index}].address.latitude`,
                      // longitude: `${parentField}[${index}].address.longitude`,
                    },
                    textFieldProps: { variant: 'standard' },
                    // autocompleteProps: { textFieldProps: {variant: 'standard'} },
                  };
                },
              },
            ]}
            gridProps={{ spacing: 6 }}
            addButtonText='Add additional interest'
            addButtonProps={{ startIcon: <PersonAddAltRounded /> }}
            values={values}
            errors={errors}
            touched={touched}
            dirty={dirty}
            dividers={true}
            dividerProps={{ sx: { my: { xs: 2, sm: 3, md: 4 } } }}
            setFieldValue={setFieldValue}
            setFieldError={setFieldError}
            setFieldTouched={setFieldTouched}
          />
        </CardContent>
      </Collapse>
    </Card>
  );
}
