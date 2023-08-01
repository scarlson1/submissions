import { Functions, httpsCallable } from 'firebase/functions';

import {
  AgencyApprovedProps,
  ContactUsEmailProps,
  NewQuoteEmailProps,
  PolicyDeliveryProps,
  SendEmailRequest,
  BaseSendEmailResponse,
} from 'common';

export const sendEmail = (functions: Functions, args: SendEmailRequest) => {
  switch (args.templateName) {
    case 'agency_approved':
      return httpsCallable<AgencyApprovedProps, BaseSendEmailResponse>(
        functions,
        'sendagencyapprovednotification'
      )(args);
    case 'quote_notification':
      return httpsCallable<NewQuoteEmailProps, BaseSendEmailResponse>(
        functions,
        'sendnewquotenotifications'
      )(args);
    case 'policy_delivery':
      return httpsCallable<PolicyDeliveryProps, BaseSendEmailResponse>(
        functions,
        'sendpolicydoc'
      )(args);
    case 'contact_us':
      return httpsCallable<ContactUsEmailProps, BaseSendEmailResponse>(
        functions,
        'sendcontactemail'
      )(args);
  }
};
