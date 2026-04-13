import { doc, getDoc } from 'firebase/firestore';
import { useCallback } from 'react';
import { useFirestore } from 'reactfire';

import { BaseSendEmailResponse, quotesCollection } from 'common';
import { onlyUnique } from 'modules/utils';
import { useAsyncToast } from './useAsyncToast';
import { usePromptForEmails } from './usePromptForEmails';
import { useSendEmail } from './useSendEmail';

export interface NotificationEmailValues {
  notifyInsured: boolean;
  notifyAgent: boolean;
  alternative: string[];
}

export const useSendQuoteNotification = (
  onSuccess?: (emails: BaseSendEmailResponse['emails'], msg?: string) => void,
  onError?: (err: any, msg: string) => void,
) => {
  const firestore = useFirestore();
  const toast = useAsyncToast();
  const promptForEmails = usePromptForEmails();
  const { send } = useSendEmail({
    onMutate: () => {
      toast.loading('sending emails...');
    },
    onSuccess: (data) => {
      console.log('RES: ', data);
      if (data?.emails && data.emails.length > 0) {
        toast.success('notifications delivered!');
        if (onSuccess) onSuccess(data.emails, 'Email notifications sent!');
      } else toast.error('No emails provided');

      return data?.emails || [];
    },
    onError: (msg: string, err: unknown) => {
      console.log('ERROR: ', err);
      let errMsg = msg || 'Notifications not delivered';
      toast.warn(errMsg);
      if (onError) onError(err, errMsg);
    },
  });

  const handleSendNotifications = useCallback(
    async (docId?: string | null) => {
      if (!docId) return;
      try {
        const snap = await getDoc(doc(quotesCollection(firestore), docId));
        if (!snap.exists() || !snap.data())
          throw new Error(`Cannot find doc with ID ${docId}`);
        const data = snap.data();

        const emails = await promptForEmails(
          {
            insuredEmail: data.namedInsured?.email || null,
            agentEmail: data.agent?.email || null,
          },
          {
            title: 'Deliver quote notification',
            description:
              'Please select the emails to which you would like to deliver the quote, if any. To add an alternative email to the recipient list, press tab, space, or enter.',
            confirmButtonText: 'Send',
          },
        );

        if (emails && emails.length > 0 && Array.isArray(emails)) {
          // try {
          const uniqEmails = emails.filter(onlyUnique);
          // toast.loading('sending emails...');
          // const data =
          await send({
            templateName: 'quote_notification',
            to: uniqEmails, // emails,
            quoteId: docId,
          });
          // console.log('RES: ', data);

          // if (data?.emails && data.emails.length > 0) {
          //   toast.success('notifications delivered!');
          //   if (onSuccess) onSuccess(data.emails, 'Email notifications sent!');
          // } else toast.error('No emails provided');

          // return data?.emails || [];
          // } catch (err) {
          //   throw err;
          // }
        }
      } catch (err) {
        console.log('ERROR: ', err);
        let msg = 'Notifications not delivered';
        toast.warn(msg);
        if (onError) onError(err, msg);
      }
    },
    [onSuccess, onError, promptForEmails, toast, send, firestore],
  );

  return handleSendNotifications;
};
