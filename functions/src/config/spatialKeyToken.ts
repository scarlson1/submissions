import axios from 'axios';
import jwt from 'jsonwebtoken';

export interface GenerateTokenArgs {
  userApiKey: string;
  orgApiKey: string;
  orgSecretKey: string;
}

export const generateRequestToken = ({
  userApiKey,
  orgApiKey,
  orgSecretKey,
}: GenerateTokenArgs) => {
  return new Promise<string>(async (resolve, reject) => {
    if (!(userApiKey && orgApiKey && orgSecretKey)) {
      reject('Missing api credentials in Google Secret Manager.');
      return;
    }

    let now = new Date();
    let iat = Math.round(now.getTime() / 1000);

    let payload = {
      iss: orgApiKey,
      prn: userApiKey,
      aud: 'https://www.spatialkey.com',
      iat,
    };

    const request_token = jwt.sign(payload, orgSecretKey, {
      algorithm: 'HS256',
      expiresIn: '1h',
    });
    resolve(request_token);
  });
};

export const exchangeToken = (requestToken: string) => {
  return new Promise<string>(async (resolve, reject) => {
    console.log('EXCHANGING TOKEN: ', requestToken);
    try {
      let { data } = await axios.post(
        `https://idemand.spatialkey.com/SpatialKeyFramework/api/v2/oauth.json`,
        {},
        {
          params: {
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: requestToken,
          },
        }
      );

      resolve(data.access_token);
    } catch (err) {
      reject(err);
    }
  });
};

export const getAccessToken = (args: GenerateTokenArgs) => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      const request_token = await generateRequestToken(args);
      const access_token = await exchangeToken(request_token);

      resolve(access_token);
    } catch (err) {
      reject(err);
    }
  });
};
