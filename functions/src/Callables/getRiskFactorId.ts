import axios from 'axios';
import * as functions from 'firebase-functions';

export const getRiskFactorId = functions.https.onCall(async (data) => {
  const { addressLine1, city, state } = data;

  try {
    const res = await axios.get<any, any>(
      `https://riskfactor.com/api/autocomplete/${encodeURIComponent(
        `${addressLine1} ${city} ${state}`.trim()
      )}`,
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );

    console.log('FIRST STREET RES: ', res);
    const { data: fsidRes } = res;

    if (!fsidRes || fsidRes.length < 1) return { fsid: null };
    return { fsid: fsidRes[0].fsid };
  } catch (err) {
    console.log('ERROR: ', err);

    throw new functions.https.HttpsError('internal', 'Error fetching Flood Factor ID');
  }
});
