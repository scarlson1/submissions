import { useCallback, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Box, Stack } from '@mui/material';
import { Form, Formik, FormikProps } from 'formik';
import * as yup from 'yup';

import { emailVal, submissionsQuotesCollection } from 'common';
import { useConfirmation } from 'modules/components/ConfirmationService';
import { ConfirmationDialog } from 'components';
import { FormikSwitch, FormikMultiTextInput } from 'components/forms';
import { sendNewQuoteNotifications } from 'modules/api/sendNewQuoteNotifications';

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

      return !!value || !!insuredVal;
    }),
  alternative: yup.array().of(emailVal.notRequired()), //  emailVal.notRequired(),
});

export interface NotificationEmailValues {
  notifyInsured: boolean;
  notifyAgent: boolean;
  alternative: string[];
}

export const useSendQuoteNotification = (
  onSuccess?: (msg: string) => void,
  onError?: (err: any, msg: string) => void
) => {
  const confirm = useConfirmation();
  const formRef = useRef<FormikProps<NotificationEmailValues>>(null);

  const handleDialogSubmit = useCallback(async () => {
    console.log('VALUES: ', formRef.current?.values);
    if (formRef.current) {
      try {
        const { values, validateForm, setTouched } = formRef.current;
        setTouched({ notifyInsured: true, notifyAgent: true });
        const valErrors = await validateForm();

        if (Object.keys(valErrors).length === 0 && valErrors.constructor === Object) {
          return values;
        } else return Promise.reject();
      } catch (err) {
        return Promise.reject(err);
      }
    }
  }, []);

  const formSub = useCallback(async () => {
    console.log('formSub');
  }, []);

  const handleDialogError = useCallback(
    async (err: unknown) => {
      if (onError) onError(err, 'Error submitting form');
    },
    [onError]
  );

  const promptForNotification = useCallback(
    async (docId: string) => {
      const snap = await getDoc(doc(submissionsQuotesCollection, docId));
      if (!snap.exists() || !snap.data()) throw new Error(`Cannot find doc with ID ${docId}`);
      const data = snap.data();

      try {
        // TODO: select user type next to the email
        const notificationEmails: NotificationEmailValues | undefined = await confirm({
          catchOnCancel: true,
          variant: 'danger',
          title: 'Notifiy Insured & Agent?',
          confirmButtonText: 'Submit',
          description:
            'Please select the emails to which you would like to deliver the quote, if any.',
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
                    alternative: [],
                  }}
                  validationSchema={notifyValidation}
                  onSubmit={formSub}
                  enableReinitialize
                  innerRef={formRef}
                >
                  {({ handleSubmit }: FormikProps<NotificationEmailValues>) => (
                    <Form onSubmit={handleSubmit}>
                      <Stack direction='column' spacing={3}>
                        <FormikSwitch
                          name='notifyInsured'
                          label={`${data.insuredEmail} (insured)`}
                          disabled={!data.insuredEmail}
                          formControlLabelProps={{ sx: { ml: 0 } }}
                        />
                        <FormikSwitch
                          name='notifyAgent'
                          label={`${data.agentEmail} (agent)`}
                          disabled={!data.agentEmail}
                          formControlLabelProps={{ sx: { ml: 0 } }}
                        />
                        <FormikMultiTextInput
                          name='alternative'
                          label='Alternative email'
                          variant='standard'
                          sx={{ maxWidth: 300 }}
                          fullWidth
                          stackProps={{ spacing: 0, sx: { flexWrap: 'wrap', my: 2 } }}
                          chipProps={{ sx: { m: '2px !important' } }}
                        />
                      </Stack>
                    </Form>
                  )}
                </Formik>
              </Box>
            </ConfirmationDialog>
          ),
        });

        let emails: string[] = [];
        console.log('notification email result: ', notificationEmails);
        if (!!notificationEmails?.notifyInsured) emails.push(data.insuredEmail || '');
        if (!!notificationEmails?.notifyAgent) emails.push(data.agentEmail || '');
        if (notificationEmails?.alternative && notificationEmails.alternative.length > 0)
          notificationEmails.alternative.forEach((e) => emails.push(e));

        console.log('EMAILS: ', emails);
        return emails.filter((i) => i);
      } catch (err) {
        if (onError) onError({}, 'Email notifications not delivered');
      }
    },
    [onError, confirm, formSub, handleDialogSubmit, handleDialogError]
  );

  const handleSendNotifications = useCallback(
    async (docId?: string | null) => {
      if (!docId) return;
      try {
        const emails = await promptForNotification(docId);

        if (emails && emails.length > 0 && Array.isArray(emails)) {
          try {
            const { data } = await sendNewQuoteNotifications({ emails, quoteId: docId });
            console.log('RES: ', data);

            if (onSuccess && data?.emails && data.emails.length > 0) {
              // data.emails.forEach((e) => onStepSuccess(`Notification sent to ${e}`));
              if (onSuccess) onSuccess('Email notifications sent!');
            }
            return data.emails || [];
          } catch (err) {
            throw err;
          }
        }
      } catch (err) {
        console.log('ERROR: ', err);
        let msg = 'Notifications not delivered';
        if (onError) onError(err, msg);
      }
    },
    [onSuccess, onError, promptForNotification]
  );

  return handleSendNotifications;
};
