import { CallableRequest } from 'firebase-functions/v2/https';
import { HttpsError } from 'firebase-functions/v1/https';
import axios from 'axios';

interface GetRiskFactorIdProps {
  addressLine1: string;
  city: string;
  state: string;
}

export default async ({ data }: CallableRequest<GetRiskFactorIdProps>) => {
  const { addressLine1, city, state } = data;

  try {
    const res = await axios.get<any, any>(
      `https://riskfactor.com/api/autocomplete/${encodeURIComponent(
        `${addressLine1} ${city} ${state}`.trim()
      )}`,
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );

    // console.log('FIRST STREET RES: ', res);
    const { data: fsidRes } = res;

    if (!fsidRes || !fsidRes.length) return { fsid: null };
    console.log(`[V2] FSID for ${addressLine1}: ${fsidRes[0].fsid}`);

    return { fsid: fsidRes[0].fsid };
  } catch (err) {
    console.log('ERROR: ', err);

    throw new HttpsError('internal', 'Error fetching Flood Factor ID');
  }
};

// import { CallableContext, HttpsError } from 'firebase-functions/v1/https';
// import axios from 'axios';

// export default async (data: any, ctx: CallableContext) => {
//   const { addressLine1, city, state } = data;

//   try {
//     const res = await axios.get<any, any>(
//       `https://riskfactor.com/api/autocomplete/${encodeURIComponent(
//         `${addressLine1} ${city} ${state}`.trim()
//       )}`,
//       { headers: { 'Access-Control-Allow-Origin': '*' } }
//     );

//     // console.log('FIRST STREET RES: ', res);
//     const { data: fsidRes } = res;

//     if (!fsidRes || !fsidRes.length) return { fsid: null };
//     console.log(`FSID for ${addressLine1}: ${fsidRes[0].fsid}`);

//     return { fsid: fsidRes[0].fsid };
//   } catch (err) {
//     console.log('ERROR: ', err);

//     throw new HttpsError('internal', 'Error fetching Flood Factor ID');
//   }
// };
