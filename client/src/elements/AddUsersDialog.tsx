import React, { useState, useCallback, useRef } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  DialogTitle,
  alpha,
  ButtonProps,
} from '@mui/material';
import { Form, Formik, FormikHelpers, FormikProps } from 'formik';
import * as yup from 'yup';

import { FormikFieldArray } from 'components/forms';
import { useInviteUsers } from 'hooks';
import { InviteUsersResponse, NewUser } from 'modules/api';
import { CUSTOM_CLAIMS } from 'modules/components';

export interface AddUserValues {
  users: NewUser[];
}

const initialValues: AddUserValues = {
  users: [
    {
      email: '',
      name: '',
      access: '',
    },
  ],
};
const validation = yup.object().shape({
  users: yup.array().of(
    yup.object().shape({
      email: yup.string().email('Must be a valid email').required('Email is required'),
      name: yup
        .string()
        .min(3, 'Please enter full name')
        .max(40, 'Must be less than 40 characters')
        .required('Full name is required'),
      access: yup
        .string()
        .oneOf(['agent', 'orgAdmin'], 'Please select an option')
        .required('Access level required'),
    })
  ),
});

interface AddUsersDialogProps {
  orgId?: string;
  buttonText?: string;
  buttonProps?: Omit<ButtonProps, 'onClick'>;
}

export const AddUsersDialog: React.FC<AddUsersDialogProps> = ({
  orgId,
  buttonText = 'Add Users (agents)',
  buttonProps,
}) => {
  const formikRef = useRef<FormikProps<AddUserValues>>(null);
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleSuccess = useCallback((result: InviteUsersResponse) => {
    formikRef.current?.setSubmitting(false);
    formikRef.current?.resetForm({ values: initialValues });
    handleClose();
  }, []);

  const handleError = useCallback((msg: string, err: any) => {
    formikRef.current?.setSubmitting(false);
    formikRef.current?.resetForm({ values: initialValues });
  }, []);

  const inviteUsers = useInviteUsers(handleSuccess, handleError);

  const handleSubmit = useCallback(
    async (values: AddUserValues, helpers: FormikHelpers<AddUserValues>) => {
      console.log('values => ', values);
      let tenantId = orgId === 'idemand' ? null : orgId;

      await inviteUsers(values.users, tenantId, orgId);
      helpers.setSubmitting(false);
    },
    [inviteUsers, orgId]
  );

  return (
    <>
      <Button variant='outlined' onClick={handleOpen} {...buttonProps}>
        {buttonText}
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth='md'>
        <DialogTitle>Add Organization Users</DialogTitle>
        <Formik
          initialValues={initialValues}
          validationSchema={validation}
          onSubmit={handleSubmit}
          innerRef={formikRef}
        >
          {({
            values,
            touched,
            errors,
            isValid,
            isSubmitting,
            isValidating,
            setFieldValue,
            setFieldError,
            setFieldTouched,
            handleSubmit,
            dirty,
          }) => (
            <Form onSubmit={handleSubmit}>
              <DialogContent dividers>
                <FormikFieldArray
                  parentField='users'
                  inputFields={[
                    {
                      name: 'name',
                      label: 'Name',
                      required: true,
                      inputType: 'text',
                    },
                    {
                      name: 'email',
                      label: 'Email',
                      required: true,
                      inputType: 'text',
                    },
                    {
                      name: 'access',
                      label: 'Role / Permissions',
                      required: true,
                      inputType: 'select',
                      selectOptions: [
                        {
                          label: 'Agent',
                          value: CUSTOM_CLAIMS.AGENT,
                        },
                        {
                          label: 'Admin',
                          value: CUSTOM_CLAIMS.ORG_ADMIN,
                        },
                      ],
                    },
                  ]}
                  values={values}
                  errors={errors}
                  touched={touched}
                  isSubmitting={isSubmitting}
                  isValidating={isValidating}
                  dirty={dirty}
                  setFieldValue={setFieldValue}
                  setFieldError={setFieldError}
                  setFieldTouched={setFieldTouched}
                />
              </DialogContent>
              <DialogActions>
                <Button
                  variant='outlined'
                  disabled={isSubmitting || isValidating}
                  onClick={handleClose}
                  sx={{
                    mt: 2,
                    color: (theme) =>
                      theme.palette.mode === 'light'
                        ? theme.palette.grey[700]
                        : theme.palette.grey[300],
                    border: (theme) =>
                      `1px solid ${
                        theme.palette.mode === 'light'
                          ? alpha(theme.palette.grey[700], 0.5)
                          : alpha(theme.palette.grey[300], 0.5)
                      }`,
                    '&:hover': {
                      border: (theme) =>
                        `1px solid ${
                          theme.palette.mode === 'light'
                            ? theme.palette.grey[700]
                            : theme.palette.grey[300]
                        }`,
                    },
                    transition: (theme) =>
                      `border ${theme.transitions.duration.standard}ms ${theme.transitions.easing.easeInOut}`,
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type='submit'
                  variant='outlined'
                  disabled={!isValid || !dirty || isSubmitting || isValidating}
                  sx={{ mt: 2 }}
                >
                  Invite Users
                </Button>
              </DialogActions>
            </Form>
          )}
        </Formik>
      </Dialog>
    </>
  );
};
