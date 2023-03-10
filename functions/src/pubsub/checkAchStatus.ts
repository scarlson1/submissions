import * as functions from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';

import { getEPayInstance } from '../services';
import { EPayGetTransactionRes, transactionsCollection, TRANSACTION_STATUS } from '../common';

const ePayCreds = defineSecret('ENCODED_EPAY_AUTH');

// FOR TESTING: '*/1 * * * *' = every minute
// '35 10 * * 1-5' = 10:35 monday-friday

// EMULATOR WORK AROUND: https://stackoverflow.com/questions/62759093/how-to-invoke-firebase-schedule-functions-locally-using-pubsub-emulator/65759654#65759654
// https://github.com/firebase/firebase-tools/issues/2034

export const checkAchStatus = functions
  .runWith({ secrets: [ePayCreds] })
  // .pubsub.schedule('*/1 * * * *')
  .pubsub.schedule('35 10 * * 1-5') // 10:35 monday-friday
  .onRun(async (context) => {
    console.log('CHECKING PAYMENT STATUS FOR OUTSTANDING EPAY ACH TRANSACTIONS');
    const db = getFirestore();

    const ePayCreds = process.env.ENCODED_EPAY_AUTH;
    if (!ePayCreds) throw new Error('Missing ePay credentials');
    const ePayInstance = getEPayInstance(ePayCreds);

    const transactionsCol = transactionsCollection(db);

    const querySnap = await transactionsCol
      .where('status', '==', TRANSACTION_STATUS.PROCESSING)
      .get();

    if (querySnap.empty) return console.log('NO OUTSTANDING ACH PAYMENTS FOUND.');

    let charges = querySnap.docs.map((s) => ({ ...s.data(), id: s.id }));
    charges.forEach((c) =>
      console.log(`CHARGE: ${c.id} - ${c.amount} - ${c.status} - ${c.userId}`)
    );

    for (const charge of charges) {
      try {
        const { data } = await ePayInstance.get<EPayGetTransactionRes>(
          `/api/v1/transactions/${charge.id}`
        );
        console.log(`RES ${charge.id} => `, JSON.stringify(data));
        let events = data.events;
        if (events && events.length > 0) {
          events.forEach((e: any) => console.log(`EVENT: ${e.eventType} - ${e.eventDate}`));

          const settleEvt = events.find((e) => e.eventType === 'Settle');
          if (settleEvt) {
            // TODO:  publish event (update transaction ?? handle in event listener ??)
          }
        }
        // TODO: update status if paid or declined

        // TODO: publish event if status changed (charge:complete or charge:declined)
      } catch (err) {
        console.log(`ERROR TRX ID: ${charge.id} => `, err);
      }
    }
  });

// {
//   "id":424603,
//   "publicId":"09e1336b7cd94130856dccef2",
//   "payer":"Foo Bar",
//   "emailAddress":"foobar@example.com",
//   "transactionType":"Ach",
//   "amount":510,
//   "fee":5,
//   "payerFee":5,
//   "maskedAccountNumber":"XXXX5678",
//   "comments":"Quote ID: WFmmFFJRxQ6ZA3NMcuOR",
//   "originalTransactionId":null,
//   "events": [
//     {"eventDate":"2023-03-07T16:11:03.927","eventType":"Sale","comments":null},{"eventDate":"2023-03-08T13:00:18.403","eventType":"Settle","comments":null},{"eventDate":"2023-03-13T12:00:00","eventType":"Hold","comments":null}
//   ],
//   "attributeValues": [
//     {"name":"Named Insured","parameterName":"namedInsured","value":null},
//     {"name":"Policy #","parameterName":"policyNumber","value":null},
//     {"name":null,"parameterName":"quoteId","value":"WFmmFFJRxQ6ZA3NMcuOR"},
//     {"name":null,"parameterName":"userId","value":"Gn4T9Oa4jg4NukyKqaj2cp2AZdX2"}
//   ],
//   "attachments":[],
//   "paidInvoices":[]
// }
