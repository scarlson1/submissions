import axios from 'axios';
import { error, info } from 'firebase-functions/logger';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

import { onCallWrapper } from '../services/sentry/index.js';

interface GetRiskFactorIdProps {
  addressLine1: string;
  city: string;
  state: string;
}

const getRiskFactorId = async ({ data }: CallableRequest<GetRiskFactorIdProps>) => {
  const { addressLine1, city, state } = data;

  try {
    const res = await axios.get<any, any>(
      `https://riskfactor.com/api/autocomplete/${encodeURIComponent(
        `${addressLine1} ${city} ${state}`.trim()
      )}`,
      { headers: { 'Access-Control-Allow-Origin': '*' } }
    );

    const { data: fsidRes } = res;

    if (!fsidRes || !fsidRes.length) return { fsid: null };
    info(`[V2] FSID for ${addressLine1}: ${fsidRes[0].fsid}`);

    return { fsid: fsidRes[0].fsid };
  } catch (err) {
    error('ERROR: ', err);

    throw new HttpsError('internal', 'Error fetching Flood Factor ID');
  }
};

export default onCallWrapper<GetRiskFactorIdProps>('getriskfactorid', getRiskFactorId);
