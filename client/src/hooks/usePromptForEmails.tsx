import { Box, Stack } from '@mui/material';
import { Form, Formik, FormikConfig, FormikHelpers, FormikProps } from 'formik';
import { RefObject, useCallback, useRef } from 'react';
import * as yup from 'yup';

import { FormikMultiTextInput, FormikSwitch } from 'components/forms';
import { ConfirmationOptions } from 'context/ConfirmationService';
import { useDialog } from 'hooks';
import { isValidEmail } from 'modules/utils';

export interface NotificationEmailValues {
  notifyInsured: boolean;
  notifyAgent: boolean;
  alternative: string[];
}

export const usePromptForEmails = () => {
  const dialog = useDialog();
  // const confirm = useConfirmation();
  const formikRef = useRef<FormikProps<NotificationEmailValues>>(null);

  const handleSubmitClick = useCallback(async () => await formikRef.current?.submitForm(), []);

  const formOnSubmit = useCallback(
    async (
      values: NotificationEmailValues,
      { setSubmitting }: FormikHelpers<NotificationEmailValues>
    ) => {
      setSubmitting(false);
      dialog?.handleAccept(values);
      return values;
    },
    [dialog]
  );

  const promptForEmails = useCallback(
    async (
      { insuredEmail, agentEmail }: { insuredEmail?: string | null; agentEmail?: string | null },
      options?: Omit<ConfirmationOptions, 'component' | 'catchOnCancel'>
    ) => {
      try {
        // TODO: select user type next to the email
        const notificationEmails: NotificationEmailValues | undefined = await dialog?.prompt({
          catchOnCancel: true,
          variant: 'danger',
          title: 'Notify Insured & Agent?',
          description:
            'Please select the emails to which you would like to deliver the quote, if any.',
          slotProps: { dialog: { maxWidth: 'sm' }, content: { dividers: true } },
          onSubmit: handleSubmitClick,
          ...options,
          content: (
            <>
              <SelectEmailsForm
                initialValues={{
                  notifyInsured: Boolean(insuredEmail) || false,
                  notifyAgent: Boolean(agentEmail) || false,
                  alternative: [],
                }}
                onSubmit={formOnSubmit}
                formRef={formikRef}
                insuredEmail={insuredEmail || null}
                agentEmail={agentEmail || null}
              />
            </>
          ),
        });

        let emails: string[] = [];
        console.log('notification email result: ', notificationEmails);
        if (!!notificationEmails?.notifyInsured) emails.push(insuredEmail || '');
        if (!!notificationEmails?.notifyAgent) emails.push(agentEmail || '');
        if (notificationEmails?.alternative && notificationEmails.alternative.length > 0)
          notificationEmails.alternative.forEach((e) => emails.push(e));

        console.log('EMAILS: ', emails);
        return emails.filter((i) => i);
      } catch (err) {
        console.log('ERR: ', err);
        return Promise.reject(err);
      }
    },
    [dialog, handleSubmitClick, formOnSubmit]
  );

  return promptForEmails;
};

const notifyValidation = yup.object().shape({
  notifyInsured: yup.boolean().when(['notifyAgent', 'alternative'], {
    is: (notifyAgent: boolean, alternative: string[]) => !notifyAgent && alternative.length < 1,
    then: yup.boolean().oneOf([true], 'Must provide or select at least one email'),
    otherwise: yup.boolean(),
  }),
  notifyAgent: yup
    .boolean()
    .test(
      'at least one',
      'At least one must be selected to send notification. Click cancel to exit without sending.',
      (value, ctx) => !!value || !!ctx.parent.notifyInsured || ctx.parent.alternative?.length > 0
    ),
  alternative: yup
    .array()
    .test(
      'alt required when insured and agent are false',
      'At lease one email required. Press tab, enter or space to included alternative email.',
      (value, ctx) => {
        if (!!ctx.parent.notifyInsured || !!ctx.parent.notifyAgent) return true;
        if (!Boolean(value && value.length > 0)) return false;

        for (let email of value!) {
          if (email && !isValidEmail(email)) return false;
        }

        return true;
      }
    ),
});

const defaultInitialValues = {
  notifyAgent: false,
  notifyInsured: false,
  alternative: [],
};
interface SelectEmailsFormProps extends FormikConfig<NotificationEmailValues> {
  formRef: RefObject<FormikProps<NotificationEmailValues>>;
  insuredEmail: string | null;
  agentEmail: string | null;
}

function SelectEmailsForm({
  initialValues = defaultInitialValues,
  onSubmit,
  formRef,
  insuredEmail,
  agentEmail,
  ...props
}: SelectEmailsFormProps) {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={notifyValidation}
      onSubmit={onSubmit}
      enableReinitialize
      innerRef={formRef}
      {...props}
    >
      {({ handleSubmit }: FormikProps<NotificationEmailValues>) => (
        <Box>
          <Form onSubmit={handleSubmit}>
            <Stack direction='column' spacing={3}>
              <FormikSwitch
                name='notifyInsured'
                label={`${insuredEmail || ''} (insured)`}
                disabled={!insuredEmail}
                formControlLabelProps={{ sx: { ml: 0 } }}
              />
              <FormikSwitch
                name='notifyAgent'
                label={`${agentEmail || ''} (agent)`}
                disabled={!agentEmail}
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
        </Box>
      )}
    </Formik>
  );
}
