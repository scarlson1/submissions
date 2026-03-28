import { Functions, httpsCallable } from 'firebase/functions';

import {
  AgencyApprovedProps,
  BaseSendEmailResponse,
  ContactUsEmailProps,
  NewQuoteEmailProps,
  PolicyDeliveryProps,
  SendEmailRequest,
} from 'common';

export const sendEmail = (functions: Functions, args: SendEmailRequest) => {
  switch (args.templateName) {
    case 'agency_approved':
      return httpsCallable<AgencyApprovedProps, BaseSendEmailResponse>(
        functions,
        'call-sendagencyapprovednotification',
      )(args);
    case 'quote_notification':
      return httpsCallable<NewQuoteEmailProps, BaseSendEmailResponse>(
        functions,
        'call-sendnewquotenotifications',
      )(args);
    case 'policy_delivery':
      return httpsCallable<PolicyDeliveryProps, BaseSendEmailResponse>(
        functions,
        'call-sendpolicydoc',
      )(args);
    case 'contact_us':
      return httpsCallable<ContactUsEmailProps, BaseSendEmailResponse>(
        functions,
        'call-sendcontactemail',
      )(args);
  }
};
