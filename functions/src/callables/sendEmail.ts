// import { EmailData } from '@sendgrid/helpers/classes/email-address';
import { info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { resendKey } from '../common/index.js';
import {
  sendAgencyApproved,
  SendAgencyApprovedProps,
  sendContact,
  SendContactProps,
  sendInvite,
  SendInviteProps,
  sendNewQuote,
  SendNewQuoteProps,
  sendPolicyDelivery,
  SendPolicyDeliveryProps,
} from '../services/sendgrid/actions/index.js';
import { onCallWrapper } from '../services/sentry/index.js';
import { requireIDemandAdminClaims, validate } from './utils/index.js';

// TODO: MOST OF THE SENDGRID ACTIONS ARE JUST SCAFFOLDING - NEED TO BE IMPLEMENTED IN services/actions/*

// TODO: discriminating union for template props
// type BaseProps = { templateId:  }
export type SendEmailProps =
  | SendAgencyApprovedProps
  | SendContactProps
  | SendInviteProps
  | SendNewQuoteProps
  | SendPolicyDeliveryProps;

const sendEmail = async ({ data, auth }: CallableRequest<SendEmailProps>) => {
  info('send email request received', { data });
  const { to, templateId } = data;

  validate(to, 'failed-precondition', 'missing "to" (recipients)');
  validate(templateId, 'failed-precondition', 'missing templateId');

  const key = resendKey.value();

  switch (data.templateId) {
    case 'contact':
      validate(
        data.userEmail && data.body,
        'failed-precondition',
        'missing email or body',
      );

      return sendContact(key, {
        ...data,
      });

    case 'agency_approved':
      // TODO: check permissions
      requireIDemandAdminClaims(auth?.token);
      return sendAgencyApproved(key, {
        ...data,
        // customArgs: {
        //   // TODO: delete (move to sendAgencyApproved)
        //   emailType: 'agency_approved',
        // },
      });

    case 'invite':
      // TODO: finish handleSendInvite
      return sendInvite(key, {
        ...data,
        // templateId: 'invite',
      });

    case 'new_quote':
      // TODO: finish sendNewQuote
      return sendNewQuote(key, {
        ...data,
        // templateId: 'new_quote',
      });

    case 'policy_doc_delivery':
      // TODO: finish handlePolicyDelivery
      return sendPolicyDelivery(key, {
        ...data,
        // templateId: 'policy_doc_delivery',
      });

    default:
      throw new HttpsError('failed-precondition', 'templateId not recognized');
  }
};

export default onCallWrapper<SendEmailProps>('sendemail', sendEmail);
