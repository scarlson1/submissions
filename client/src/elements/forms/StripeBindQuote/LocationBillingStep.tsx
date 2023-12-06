// replacement for BillingStep

import { AddRounded, ExpandMoreRounded, PersonAddAltRounded } from '@mui/icons-material';
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  ButtonProps,
  Card,
  CardContent,
  CardMedia,
  CardMediaProps,
  Collapse,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Unstable_Grid2 as Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCallback, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useFunctions } from 'reactfire';
import { object, string } from 'yup';

import { addBillingEntity as addBillingEntityFn } from 'api';
import {
  AdditionalInterest,
  Address,
  BillingEntity,
  BillingType,
  NamedInsuredDetails,
  Quote,
  TCollection,
  emailVal,
  fallbackImages,
  phoneVal,
} from 'common';
import {
  FormikFieldArray,
  FormikMaskField,
  FormikNativeSelect,
  FormikTextField,
  FormikWizardNavButtons,
  IMask,
  phoneMaskProps,
} from 'components/forms';
import { SelectOption } from 'components/forms/FormikSelect';
import { Form, Formik, FormikConfig, FormikProps, useFormikContext } from 'formik';
import { useDocData, useWizard } from 'hooks';
import { BindQuoteProps } from './NamedInsuredStep';

// list locations
// add billing entity button
//    - open dialog to create new stripe user ??
// list all locations (cards ??)
//    - select dropdown for billing entity
//    - add additional insured button that opens collapse to add additional insured ??
//        - or dialog ?? b/c eventually will be stored in locations collection docs

const useAddBillingEntity = (
  colName: TCollection,
  docId: string,
  onSuccess?: (cusId: string) => void,
  onError?: (msg: string, err: any) => void
) => {
  const functions = useFunctions();
  const [loading, setLoading] = useState(false);

  // call backend with cus details -- create/retrieve customer --> add to quote
  const addBillingEntity = useCallback(
    async (billingEntityDetails: Pick<BillingEntity, 'displayName' | 'email' | 'phone'>) => {
      try {
        setLoading(true);
        const { data } = await addBillingEntityFn(functions, {
          collection: colName,
          docId,
          billingEntityDetails,
        });

        console.log('data: ', data);

        setLoading(false);
        onSuccess && onSuccess(data.stripeCustomerId);
      } catch (err: any) {
        setLoading(false);
        let msg = err?.message || 'Error adding billing entity';
        onError && onError(msg, err);
      }
    },
    [functions, onSuccess, onError, colName, docId]
  );

  return useMemo(() => ({ addBillingEntity, loading }), [addBillingEntity, loading]);
};

const newBillingEntityVal = object().shape({
  displayName: string().required(),
  email: emailVal.required(),
  phone: phoneVal.required(),
  billingPref: string().notRequired(),
});

interface NewBillingEntityValues {
  email: string;
  phone: string;
  displayName: string;
  billingPref: string; // BillingType
}

type NewBillingEntityFormProps = FormikConfig<NewBillingEntityValues>;

function NewBillingEntityForm(props: NewBillingEntityFormProps) {
  return (
    <Formik validationSchema={newBillingEntityVal} {...props}>
      {({ handleSubmit }) => (
        <Form onSubmit={handleSubmit}>
          <Grid container spacing={4}>
            <Grid xs={6}>
              <FormikTextField name='displayName' label='Name' required fullWidth />
            </Grid>
            <Grid xs={6}>
              <FormikTextField name='email' label='Email' required fullWidth />
            </Grid>
            <Grid xs={6}>
              <FormikMaskField
                id='phone'
                name='phone'
                label='Phone'
                maskComponent={IMask}
                inputProps={{ maskProps: phoneMaskProps }}
                required
                fullWidth
              />
            </Grid>
            <Grid xs={6}>
              <FormikNativeSelect
                name='billingPref'
                label='Billing Preference'
                fullWidth
                selectOptions={BillingType.options}
              />
            </Grid>
          </Grid>
        </Form>
      )}
    </Formik>
  );
}

interface AddBillingEntityProps {
  colName: TCollection;
  docId: string;
  buttonProps?: Omit<ButtonProps, 'onClick'>;
}

function AddBillingEntity({ colName, docId, buttonProps }: AddBillingEntityProps) {
  const [open, setOpen] = useState(false);
  const { addBillingEntity } = useAddBillingEntity(
    colName,
    docId,
    () => {
      toast.success(`billing entity added`);
      setOpen(false);
    },
    (msg: string) => toast.error(msg)
  );
  const formRef = useRef<FormikProps<NewBillingEntityValues>>(null);

  return (
    <Box>
      <Button onClick={() => setOpen(true)} {...buttonProps}>
        Add Billing Entity
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>New Billing Entity</DialogTitle>
        <DialogContent dividers>
          <NewBillingEntityForm
            initialValues={{
              displayName: '',
              email: '',
              phone: '',
              billingPref: '',
            }}
            onSubmit={addBillingEntity}
            innerRef={formRef}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              console.log(formRef.current);
              if (
                !formRef.current?.isValid ||
                formRef.current?.isSubmitting ||
                formRef.current?.isValidating
              )
                return;
              formRef.current?.submitForm();
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

const locationBillingVal = object().shape({
  defaultBillingEntityId: string().required(),
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
//    - additional interests stored in location doc ()
//    - field value: locations.lcnId.billingEntityId
//    - virtualize cards
//    - lazy load additional insureds / use react query ??

export const LocationBillingStep = ({
  colName,
  docId,
  address,
  img,
  formRef,
  onStepSubmit,
}: LocationBillingStepProps) => {
  const { nextStep } = useWizard();
  // TODO: fix type instead of Pick<Quote>
  // pass options & additional interest getter fn --> useMemo to return options & AI ??
  const { data } = useDocData<
    Pick<Quote, 'billingEntities' | 'defaultBillingEntityId' | 'additionalInterests'>
  >(colName, docId);
  // console.log('doc data: ', data);

  const billingEntityOptions = useMemo(
    () =>
      Object.entries(data?.billingEntities || {}).map(([cusId, details]) => ({
        value: cusId,
        label: `${details.displayName || ''} (${details.email})`,
        ...details,
      })),
    [data]
  );

  const handleSubmit = useCallback(
    async (values: BillingEntityStepValues) => {
      try {
        console.log('step values: ', values);
        await onStepSubmit({
          defaultBillingEntityId: values.defaultBillingEntityId,
          additionalInterests: values.additionalInterests,
        });

        await nextStep();
      } catch (err: any) {
        console.log('err: ', err);
      }
    },
    [nextStep]
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 3 }}>
        <Typography variant='h5'>Billing Entity & Additional Insured</Typography>
        <AddBillingEntity
          colName={colName}
          docId={docId}
          buttonProps={{ variant: 'contained', size: 'small', startIcon: <AddRounded /> }}
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
                // @ts-ignore
                namedInsured={data.namedInsured}
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
  const { values, touched, errors, dirty, setFieldValue, setFieldTouched, setFieldError } =
    useFormikContext<BillingEntityStepValues>();
  const [expanded, setExpanded] = useState(false);
  console.log('values ', values);

  const handleExpandClick = () => {
    // TODO: dont allow collapse if form is invalid (use formik context, check if key included in errors)
    setExpanded(!expanded);
  };

  return (
    <Card>
      <Box sx={{ display: { xs: 'block', sm: 'flex' } }}>
        <CardMedia
          component='img'
          sx={{ width: { xs: '100%', sm: 140 }, height: { xs: 120, sm: 'auto' } }}
          image={img || fallbackImages[0]}
          alt={`${address.addressLine1}`}
        />
        <CardContent sx={{ p: 0, '&.MuiCardContent-root:last-child': { pb: 0 } }}>
          <Grid container spacing={4} sx={{ px: 4, pt: 4, pb: 2 }}>
            <Grid xs={7}>
              <Typography component='div' variant='h5'>
                {address?.addressLine1 || 'Missing address'}
              </Typography>
              <Typography variant='subtitle2' color='text.tertiary' component='div'>
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
            <Grid xs={12} sx={{ display: 'flex', pt: 6 }}>
              <AvatarGroup max={4} spacing='small' sx={{ justifyContent: 'flex-end' }}>
                {namedInsured ? (
                  <Tooltip title={`${namedInsured.firstName}`} key={namedInsured.email}>
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
                        <Avatar alt={`${f.email}-${i}`} sx={{ width: 30, height: 30 }} />
                      </Tooltip>
                    ))
                  : null}
              </AvatarGroup>
              <IconButton
                onClick={handleExpandClick}
                aria-expanded={expanded}
                aria-label='edit additional interests'
                sx={{ ml: 'auto' }}
                size='small'
              >
                <ExpandMoreRounded />
              </IconButton>
            </Grid>
          </Grid>
        </CardContent>
        {/* TODO: additional insured avatar group */}
        {/* TODO: additional insured regular button with expand icon */}
        {/* <CardActions disableSpacing>
          <IconButton
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label='edit additional interests'
            sx={{ ml: 'auto' }}
          >
            <ExpandMoreRounded />
          </IconButton>
        </CardActions> */}
        {/* <Box>
          <ExpandMore
          expand={expanded}
          onClick={handleExpandClick}
          aria-expanded={expanded}
          aria-label="show more"
        >
          <ExpandMoreIcon />
          </ExpandMore>
        </Box> */}
        {/* </Box> */}
      </Box>
      <Collapse
        in={expanded}
        timeout='auto'
        sx={{
          flexBasis: '100%',
          borderTop: (theme) => (expanded ? `1px solid ${theme.palette.divider}` : undefined),
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
              },
              {
                name: 'name',
                label: 'Name',
                required: false,
                inputType: 'text',
              },
              {
                name: 'accountNumber',
                label: 'Account Number',
                required: false,
                inputType: 'text',
                helperText: 'loan number (optional)',
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
                  };
                },
              },
            ]}
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
