import {
  Box,
  Button,
  ButtonProps,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import { FormikProps } from 'formik';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

import type { TCollection } from '@idemand/common';
import {
  NewBillingEntityForm,
  NewBillingEntityValues,
} from './NewBillingEntityForm';
import { useAddBillingEntity } from './useAddBillingEntity';

interface AddBillingEntityProps {
  colName: TCollection;
  docId: string;
  buttonProps?: Omit<ButtonProps, 'onClick'>;
}

export function AddBillingEntity({
  colName,
  docId,
  buttonProps,
}: AddBillingEntityProps) {
  const [open, setOpen] = useState(false);
  const { addBillingEntity } = useAddBillingEntity(
    colName,
    docId,
    () => {
      toast.success(`billing entity added`);
      setOpen(false);
    },
    (msg: string) => toast.error(msg),
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
