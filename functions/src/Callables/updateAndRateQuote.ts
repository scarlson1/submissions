import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import axios from 'axios';
import merge from 'deepmerge';

const TENANT_ID = '516ffcbc-6e4e-4dad-98ee-ac5f615fbab6';

// TODO: might have to convert to onRequest cloud function
// app.use(cookieParser())
// https://stackoverflow.com/questions/43002444/make-axios-send-cookies-in-its-requests-automatically
// axios.get(BASE_URL + '/todos', { withCredentials: true });
// OR axios.defaults.withCredentials = true
// OR const instance = axios.create({
//    withCredentials: true,
//    baseURL: BASE_URL
// })

export default async ({ data }: CallableRequest) => {
  console.log('REQUEST DATA: ', data);
  const { quoteId, values, protosureData } = data;
  // TODO: get protosure data from protosure, not from client

  // DOES ADDRESS CHANGE RETRIGGER HAZARDHUB CALL ?? OR SHOULD IT RESET QUOTE FORM ??

  console.log('PROTOSURE INPUT DATA: ', protosureData.inputData);

  const updateBody = merge(protosureData.inputData, {
    Risk_Location_Address: {
      ...protosureData.inputData.Risk_Location_Address,
      street1: values.addressLine1,
      city: values.city,
      state: values.state,
      zip: values.postal,
      latitude: values.latitude,
      longitude: values.longitude,
      // countyFips: '45079',
      // countyName: 'Richland County',
    },
    Building_Coverage_Limit: 100000, // TODO: what about before rater runs ?? pass another param?
    Unattached_Dwellings_Limit: 20000,
    Content_Limit: 60000,
    Living_Expenses_Limit: 20000,
    // WSelect_Policy_Deductible: values.deductible
    Historical_losses: values.priorLossCount ?? 0,
    First_Named_Insured: values.firstName,
    // Policy_Effective_Date
    // Policy_Expiration_Date
    // Surplus_Lines_Home_State
  });
  console.log('UPDATE BODY: ', updateBody);

  let res: any = {};

  // UPDATE THE QUOTE INPUT VALUES
  try {
    const { data } = await axios.patch(
      `https://api-demo.protosure.io/public-api/${TENANT_ID}/quotes/${quoteId}/update_input_data/`,
      { inputData: { ...updateBody } },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('UPDATE QUOTE RESPONSE: ', data);
    res.updateQuoteRes = data;

    const { data: raterRes } = await axios.post(
      `https://api-demo.protosure.io/public-api/${TENANT_ID}/quotes/${quoteId}/calculate_rater/`,
      {},
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('rater res: ', raterRes);

    res.raterData = raterRes;

    // TODO: get values to fill form
    // initializeForm: getInitialFormData(data),

    return res;
  } catch (err) {
    // console.log('ERROR: ', err);
    // @ts-ignore
    console.log('ERROR: ', err.response.data);

    throw new HttpsError('internal', `Error retrieving or initializing quote`);
  }

  // // RUN RATER
  // try {
  // } catch (err) {}
};

// function getInitialFormData(p: any) {
//   const { formData } = p;
//   const { Risk_Location_Address } = formData;
//   return {
//     addressLine1: Risk_Location_Address.street1,
//     addressLine2: Risk_Location_Address.street2 || '',
//     city: Risk_Location_Address.city,
//     state: Risk_Location_Address.state,
//     postal: Risk_Location_Address.zip,
//     latitude: Risk_Location_Address.latitude,
//     longitude: Risk_Location_Address.longitude,
//     coverageActiveBuilding: true,
//     coverageActiveStructures: true,
//     coverageActiveContents: true,
//     coverageActiveAdditional: true,
//     limitA: formData.Building_Coverage_Limit ?? '',
//     limitB: formData.Unattached_Dwellings_Limit ?? '',
//     limitC: formData.Content_Limit ?? '',
//     limitD: formData.Living_Expenses_Limit ?? '',
//     deductible: 2000,
//     priorLossCount:
//       typeof formData.Historical_losses === 'string' ? 0 : formData.Historical_losses ?? 0,
//     firstName: formData.First_Named_Insured,
//     lastName: '', // TODO: not returned from protosure
//     email: '', // TODO:
//   };
// }
