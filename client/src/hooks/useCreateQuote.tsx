import { useCallback } from 'react';
import { FirebaseError } from 'firebase/app';
import { addDoc, doc, FirestoreError, getDoc } from 'firebase/firestore';
import { Box, Stack } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import * as yup from 'yup';

import { NewQuoteValues } from 'views/admin/QuoteNew';
import { readableFirebaseCode } from 'modules/utils/helpers';
import { quotesCollection } from 'common';
import { useConfirmation } from 'modules/components/ConfirmationService';
import { ConfirmationDialog } from 'components';
import { FormikSwitch } from 'components/forms';

const notifyValidation = yup.object().shape({
  notifyInsured: yup
    .boolean()
    .test(
      'at least one',
      'At least one must be selected to send notification',
      (value, ctx) => !!value || !!ctx.parent.notifyAgent
    ),
  notifyAgent: yup
    .boolean()
    .test('at least one', 'At least one must be selected to send notification', (value, ctx) => {
      let insuredVal = ctx.parent.notifyInsured;
      console.log('insured val: ', insuredVal);

      return !!value || !!insuredVal;
    }),
});

export interface NotificationEmailValues {
  notifyInsured: boolean;
  notifyAgent: boolean;
  // emails: string[]
  // notifications: { email: string, shouldSend: boolean }[]
}

export const useCreateQuote = (
  onStepSuccess?: (msg: string) => void,
  onError?: (err: unknown, msg: string) => void
) => {
  const confirm = useConfirmation();

  const handleDialogSubmit = useCallback(async () => {
    alert('TODO: handle sumbit');
  }, []);
  const formSub = useCallback(async () => {
    alert('TODO: handle Form Submit');
  }, []);

  const handleDialogError = useCallback(async (err: unknown) => {
    alert('handle notification dialog error');
  }, []);

  const promptNotification = useCallback(
    async (docId: string) => {
      const snap = await getDoc(doc(quotesCollection, docId));
      if (!snap.exists() || !snap.data()) throw new Error(`Cannot find doc with ID ${docId}`);
      const data = snap.data();

      try {
        // TODO: select user type next to the email
        const notificationEmails = await confirm({
          catchOnCancel: true,
          variant: 'danger',
          title: 'Email delivery/notification',
          confirmButtonText: 'Submit',
          description:
            'Please select the emails to which you would like to deliver the quote, if any',
          dialogContentProps: { dividers: true },
          component: (
            <ConfirmationDialog
              open={true}
              onAccept={() => {}}
              onClose={() => {}}
              onSubmit={handleDialogSubmit}
              onSubmitError={handleDialogError}
              dialogProps={{ maxWidth: 'sm' }}
            >
              <Box sx={{ py: { xs: 3, sm: 4, md: 5 } }}>
                <Formik
                  initialValues={{
                    notifyInsured: Boolean(data.insuredEmail) || false,
                    notifyAgent: Boolean(data.agentEmail) || false,
                  }}
                  validationSchema={notifyValidation}
                  onSubmit={formSub}
                  enableReinitialize
                  // innerRef={formRef}
                >
                  {({ handleSubmit }: FormikProps<NotificationEmailValues>) => (
                    <Form onSubmit={handleSubmit}>
                      <Stack direction='column' spacing={3}>
                        <FormikSwitch
                          name='notifyInsured'
                          label={`${data.insuredEmail} (insured)`}
                          disabled={!data.insuredEmail}
                        />
                        <FormikSwitch
                          name='notifyInsured'
                          label={`${data.agentEmail} (agent)`}
                          disabled={!data.agentEmail}
                        />
                      </Stack>
                    </Form>
                  )}
                </Formik>
              </Box>
            </ConfirmationDialog>
          ),
        });

        console.log('notification email result: ', notificationEmails);
      } catch (err) {}
    },
    [confirm, formSub, handleDialogSubmit, handleDialogError]
  );

  const createQuote = useCallback(
    async (values: NewQuoteValues) => {
      try {
        // TODO: valiation and format data
        // @ts-ignore
        const quoteRef = await addDoc(quotesCollection, {
          ...values,
        });

        if (onStepSuccess) onStepSuccess(`Quote created ${quoteRef.id}`);
        // TODO: get doc and display in popover
        return promptNotification(quoteRef.id);
      } catch (err) {
        console.log('ERROR CREATING QUOTE', err);
        let msg = 'Error creating quote';
        if (err instanceof FirebaseError) msg += readableFirebaseCode(err as FirestoreError);
        if (onError) onError(err, msg);
      }
    },
    [onStepSuccess, onError, promptNotification]
  );

  return createQuote;
};
