/* eslint-disable */
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { Address } from '../common';
import { getSignNowInstance } from '../services';
import { signNowCreds, signNowUserCreds } from '../common';

const DEFAULT_TEMPLATE_ID = '6f59b30e2005428998518ade9f325f6c405391d6';

interface GetAnnualPremiumData {
  templateId?: string;
  recipientName: string;
  email: string;
  companyName: string;
  companyAddress: Address;
}

export default async ({ data, auth }: CallableRequest<GetAnnualPremiumData>) => {
  if (!auth?.token.iDemandAdmin)
    throw new HttpsError('permission-denied', 'must have admin permissions');

  const {
    templateId = DEFAULT_TEMPLATE_ID,
    companyName,
    companyAddress,
    recipientName,
    email,
  } = data;

  const snCreds = signNowCreds.value();
  const snUserCreds = signNowUserCreds.value();

  const parsedCreds = signNowCreds ? JSON.parse(snCreds) : null;
  const parsedUserCreds = snUserCreds ? JSON.parse(snUserCreds) : null;
  const basicAuthToken = parsedCreds?.basicAuthToken;
  const accountEmail = parsedUserCreds?.accountEmail;
  const accountPW = parsedUserCreds?.accountPW;

  if (!(accountEmail && accountPW && basicAuthToken)) {
    throw new HttpsError('internal', `Missing external API credentials`);
  }

  let signNowInstance;

  try {
    signNowInstance = getSignNowInstance(basicAuthToken, accountEmail, accountPW);
  } catch (err: any) {
    console.log('ERROR: ', err?.data);
    throw new HttpsError('internal', `Error generating access token`);
  }

  let docId;
  try {
    console.log(`GENERATING DOC FROM TEMPLATE ${templateId}`);
    const { data: copyRes } = await signNowInstance.post(`template/${templateId}/copy`, {
      document_name: `iDemand Agency Agreement - ${companyName}`.trim(),
    });

    console.log('COPY RES: ', copyRes);
    if (copyRes?.id) {
      docId = copyRes.id;
    } else {
      throw new Error('Error generating doc');
    }
  } catch (err) {
    console.log('ERR: ', err);

    throw new HttpsError('internal', `Error generating document`);
  }

  // TODO: prefill doc fields
  // PUT https://api-eval.signnow.com/v2/documents/{ document_id } /prefill-texts
  // PUT https://api-eval.signnow.com/document/{document_id} - adds fields to a document
  let prefillRes;
  let errors: any[] = [];
  try {
    const reqBody = {
      fields: [
        {
          x: 120, // 190,
          y: 225, // 325,
          width: 300,
          height: 20,
          type: 'text',
          page_number: 0,
          required: true,
          role: 'Agency Signer',
          custom_defined_option: false,
          label: 'Agency Name',
          name: 'agencyName1',
          prefilled_text: `${companyName}`,
          // validator_id: '{{number_validator_id}}',
        },
        {
          x: 210, // 200, // 175,
          y: 100, // 80, // 145,
          width: 140,
          height: 16,
          type: 'text',
          page_number: 1,
          required: true,
          role: 'Agency Signer',
          custom_defined_option: false,
          label: 'Agency Name',
          name: 'agencyName2',
          prefilled_text: `${companyName}`,
        },
        {
          x: 360, // 400, // 525
          y: 230, // 175,
          width: 180,
          height: 16,
          type: 'text',
          page_number: 4,
          required: true,
          role: 'Agency Signer',
          custom_defined_option: false,
          label: 'Agency Name',
          name: 'agencyName3',
          prefilled_text: `${companyName}`,
        },
        {
          x: 360, // 400, // 525
          y: 250, // 195, // 366,
          width: 180,
          height: 16,
          type: 'text',
          page_number: 4,
          required: true,
          role: 'Agency Signer',
          custom_defined_option: false,
          label: 'Agency Street Address',
          name: 'streetAddress',
          prefilled_text: `${companyAddress.addressLine1} ${companyAddress.addressLine2}`.trim(),
        },
        {
          x: 360, // 400, // 525,
          y: 270, // 220, // 392,
          width: 180,
          height: 16,
          type: 'text',
          page_number: 4,
          required: true,
          role: 'Agency Signer',
          custom_defined_option: false,
          label: 'Agency Address 2',
          name: 'Address2',
          prefilled_text:
            `${companyAddress.city}, ${companyAddress.state} ${companyAddress.postal}`.trim(),
        },
        {
          x: 390, // 350, // 564,
          y: 320, // 475,
          width: 180,
          height: 16,
          type: 'text',
          page_number: 4,
          required: true,
          role: 'Agency Signer',
          custom_defined_option: false,
          label: 'Contact Email',
          name: 'contactEmail',
          prefilled_text: `${email}`.trim(),
        },
        {
          x: 400, // 575,
          y: 340, // 500,
          width: 180,
          height: 16,
          type: 'text',
          page_number: 4,
          required: true,
          role: 'Agency Signer',
          custom_defined_option: false,
          label: 'Contact Name',
          name: 'contactName',
          prefilled_text: `${recipientName}`.trim(),
        },
        {
          x: 375, // 350, // 550,
          y: 472, // 450, // 685,
          width: 120,
          height: 24,
          page_number: 4,
          label: 'Signature',
          role: 'Agency Signer',
          required: true,
          type: 'signature',
        },
        {
          x: 380, // 340, //  545,
          y: 500, // 475, // 730,
          width: 100,
          height: 16,
          type: 'text',
          page_number: 4,
          required: true,
          role: 'Agency Signer',
          custom_defined_option: false,
          label: 'Contact Name',
          name: 'contactName2',
          prefilled_text: `${recipientName}`.trim(),
        },
        // {
        //   x: 560,
        //   y: 772,
        //   width: 180,
        //   height: 16,
        //   type: 'datetime',
        //   page_number: 4,
        //   required: true,
        //   role: 'Agency Signer',
        //   custom_defined_option: false,
        //   label: 'Contact Name',
        //   name: 'contactSignDate',
        //   // prefilled_text: `${recipientName}`.trim(),
        // },
      ],
      elements: [],
      // client_timestamp: 'timestamp',
    };
    // type options: “text”, “signature”, “initials”, “checkbox”, “radiobutton”, or “enumeration”

    // prefillBody
    // const prefillBody = {
    //   "fields": [
    //     {
    //       "field_name": "first_name",
    //       "prefilled_text": "Jane"
    //     },
    //     {
    //       "field_name": "last_name",
    //       "prefilled_text": "Doe"
    //     }
    //   ]
    // }
    // const { data } = await signNowInstance.put(`/v2/documents/${docId}/prefill-texts`, reqBody);

    const { data } = await signNowInstance.put(`/document/${docId}`, reqBody);

    console.log('PREFILL RES: ', data);
    prefillRes = data;
  } catch (err: any) {
    console.log('ERROR UPDATING DOC WITH COMPANY INFO: ', err?.response?.data);
    if (err?.response?.data?.errors?.length) {
      errors = [...err?.response?.data?.errors];
    }
  }

  // TODO: send agreement
  // POST https://api-eval.signnow.com/document/{document_id}/invite
  // SDK: https://github.com/signnow/SignNowNodeSDK#create-invite-to-sign-a-document
  // const reqBody = {
  //   to: [
  //     {
  //       email: 'signer@email.com',
  //       role_id: '',
  //       role: 'Signer',
  //       order: 1,
  //     },
  //   ],
  //   from: 'sender@email.com',
  //   cc: [],
  //   subject: 'You’ve got a new signature request',
  //   message: 'Hi, this is an invitation email.',
  // };

  return {
    status: 'sent',
    docId,
    prefillRes,
    errors,
  };
};
/* eslint-enable */

// export const deliverAgencyAgreement = functions
//   .runWith({ secrets: [signNowCreds, signNowUserCreds] })
//   .https.onCall(async (data: GetAnnualPremiumData, context) => {
//     if (!context.auth?.token.iDemandAdmin)
//       throw new functions.https.HttpsError('permission-denied', 'must have admin permissions');

//     const {
//       templateId = DEFAULT_TEMPLATE_ID,
//       companyName,
//       companyAddress,
//       recipientName,
//       email,
//     } = data;

//     const snCreds = signNowCreds.value();
//     const snUserCreds = signNowUserCreds.value();

//     const parsedCreds = signNowCreds ? JSON.parse(snCreds) : null;
//     const parsedUserCreds = snUserCreds ? JSON.parse(snUserCreds) : null;
//     const basicAuthToken = parsedCreds?.basicAuthToken;
//     const accountEmail = parsedUserCreds?.accountEmail;
//     const accountPW = parsedUserCreds?.accountPW;

//     if (!(accountEmail && accountPW && basicAuthToken)) {
//       throw new functions.https.HttpsError('internal', `Missing external API credentials`);
//     }

//     let signNowInstance;

//     try {
//       signNowInstance = getSignNowInstance(basicAuthToken, accountEmail, accountPW);
//     } catch (err: any) {
//       console.log('ERROR: ', err?.data);
//       throw new functions.https.HttpsError('internal', `Error generating access token`);
//     }

//     let docId;
//     try {
//       console.log(`GENERATING DOC FROM TEMPLATE ${templateId}`);
//       const { data: copyRes } = await signNowInstance.post(`template/${templateId}/copy`, {
//         document_name: `iDemand Agency Agreement - ${companyName}`.trim(),
//       });

//       console.log('COPY RES: ', copyRes);
//       if (copyRes?.id) {
//         docId = copyRes.id;
//       } else {
//         throw new Error('Error generating doc');
//       }
//     } catch (err) {
//       console.log('ERR: ', err);

//       throw new functions.https.HttpsError('internal', `Error generating document`);
//     }

//     // TODO: prefill doc fields
//     // PUT https://api-eval.signnow.com/v2/documents/{ document_id } /prefill-texts
//     // PUT https://api-eval.signnow.com/document/{document_id} - adds fields to a document
//     let prefillRes;
//     let errors: any[] = [];
//     try {
//       const reqBody = {
//         fields: [
//           {
//             x: 120, // 190,
//             y: 225, // 325,
//             width: 300,
//             height: 20,
//             type: 'text',
//             page_number: 0,
//             required: true,
//             role: 'Agency Signer',
//             custom_defined_option: false,
//             label: 'Agency Name',
//             name: 'agencyName1',
//             prefilled_text: `${companyName}`,
//             // validator_id: '{{number_validator_id}}',
//           },
//           {
//             x: 210, // 200, // 175,
//             y: 100, // 80, // 145,
//             width: 140,
//             height: 16,
//             type: 'text',
//             page_number: 1,
//             required: true,
//             role: 'Agency Signer',
//             custom_defined_option: false,
//             label: 'Agency Name',
//             name: 'agencyName2',
//             prefilled_text: `${companyName}`,
//           },
//           {
//             x: 360, // 400, // 525
//             y: 230, // 175,
//             width: 180,
//             height: 16,
//             type: 'text',
//             page_number: 4,
//             required: true,
//             role: 'Agency Signer',
//             custom_defined_option: false,
//             label: 'Agency Name',
//             name: 'agencyName3',
//             prefilled_text: `${companyName}`,
//           },
//           {
//             x: 360, // 400, // 525
//             y: 250, // 195, // 366,
//             width: 180,
//             height: 16,
//             type: 'text',
//             page_number: 4,
//             required: true,
//             role: 'Agency Signer',
//             custom_defined_option: false,
//             label: 'Agency Street Address',
//             name: 'streetAddress',
//             prefilled_text: `${companyAddress.addressLine1} ${companyAddress.addressLine2}`.trim(),
//           },
//           {
//             x: 360, // 400, // 525,
//             y: 270, // 220, // 392,
//             width: 180,
//             height: 16,
//             type: 'text',
//             page_number: 4,
//             required: true,
//             role: 'Agency Signer',
//             custom_defined_option: false,
//             label: 'Agency Address 2',
//             name: 'Address2',
//             prefilled_text:
//               `${companyAddress.city}, ${companyAddress.state} ${companyAddress.postal}`.trim(),
//           },
//           {
//             x: 390, // 350, // 564,
//             y: 320, // 475,
//             width: 180,
//             height: 16,
//             type: 'text',
//             page_number: 4,
//             required: true,
//             role: 'Agency Signer',
//             custom_defined_option: false,
//             label: 'Contact Email',
//             name: 'contactEmail',
//             prefilled_text: `${email}`.trim(),
//           },
//           {
//             x: 400, // 575,
//             y: 340, // 500,
//             width: 180,
//             height: 16,
//             type: 'text',
//             page_number: 4,
//             required: true,
//             role: 'Agency Signer',
//             custom_defined_option: false,
//             label: 'Contact Name',
//             name: 'contactName',
//             prefilled_text: `${recipientName}`.trim(),
//           },
//           {
//             x: 375, // 350, // 550,
//             y: 472, // 450, // 685,
//             width: 120,
//             height: 24,
//             page_number: 4,
//             label: 'Signature',
//             role: 'Agency Signer',
//             required: true,
//             type: 'signature',
//           },
//           {
//             x: 380, // 340, //  545,
//             y: 500, // 475, // 730,
//             width: 100,
//             height: 16,
//             type: 'text',
//             page_number: 4,
//             required: true,
//             role: 'Agency Signer',
//             custom_defined_option: false,
//             label: 'Contact Name',
//             name: 'contactName2',
//             prefilled_text: `${recipientName}`.trim(),
//           },
//           // {
//           //   x: 560,
//           //   y: 772,
//           //   width: 180,
//           //   height: 16,
//           //   type: 'datetime',
//           //   page_number: 4,
//           //   required: true,
//           //   role: 'Agency Signer',
//           //   custom_defined_option: false,
//           //   label: 'Contact Name',
//           //   name: 'contactSignDate',
//           //   // prefilled_text: `${recipientName}`.trim(),
//           // },
//         ],
//         elements: [],
//         // client_timestamp: 'timestamp',
//       };
//       // type options: “text”, “signature”, “initials”, “checkbox”, “radiobutton”, or “enumeration”

//       // prefillBody
//       // const prefillBody = {
//       //   "fields": [
//       //     {
//       //       "field_name": "first_name",
//       //       "prefilled_text": "Jane"
//       //     },
//       //     {
//       //       "field_name": "last_name",
//       //       "prefilled_text": "Doe"
//       //     }
//       //   ]
//       // }
//       // const { data } = await signNowInstance.put(`/v2/documents/${docId}/prefill-texts`, reqBody);

//       const { data } = await signNowInstance.put(`/document/${docId}`, reqBody);

//       console.log('PREFILL RES: ', data);
//       prefillRes = data;
//     } catch (err: any) {
//       console.log('ERROR UPDATING DOC WITH COMPANY INFO: ', err?.response?.data);
//       if (err?.response?.data?.errors?.length) {
//         errors = [...err?.response?.data?.errors];
//       }
//     }

//     // TODO: send agreement
//     // POST https://api-eval.signnow.com/document/{document_id}/invite
//     // SDK: https://github.com/signnow/SignNowNodeSDK#create-invite-to-sign-a-document
//     // const reqBody = {
//     //   to: [
//     //     {
//     //       email: 'signer@email.com',
//     //       role_id: '',
//     //       role: 'Signer',
//     //       order: 1,
//     //     },
//     //   ],
//     //   from: 'sender@email.com',
//     //   cc: [],
//     //   subject: 'You’ve got a new signature request',
//     //   message: 'Hi, this is an invitation email.',
//     // };

//     return {
//       status: 'sent',
//       docId,
//       prefillRes,
//       errors,
//     };
//   });
// /* eslint-enable */
