import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const parent = `projects/${process.env.PROJECT_NUMBER}`;

export const getSecret = async (name: string, ver: string = 'latest') => {
  const [version] = await client.accessSecretVersion({
    name: `${parent}/secrets/${name}/versions/${ver}`,
  });

  if (version) {
    try {
      // json ????
      return version.payload?.data?.toString();
    } catch (err) {
      throw Error(
        `Unable to parse secret from Secret Manager. Make sure the secret is JSON formatted: ${err}`
      );
    }
  }
  throw Error(`Environment variable not found (${name})`);
};

export const listSecrets = async () => {
  const [secrets] = await client.listSecrets({
    parent: parent,
  });

  let secretNames: string[] = [];

  secrets.forEach((secret: any) => {
    secretNames.push(secret.name.split('/')[3]);
    console.log(secret);
    // const policy = secret.replication.userManaged
    //   ? secret.replication.userManaged
    //   : secret.replication.automatic;
    // console.log(`${secret.name} (${policy})`);
  });

  console.log('secret names: ', secretNames);
  return secretNames;
};
