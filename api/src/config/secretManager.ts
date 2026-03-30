import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
// const parent = `projects/${process.env.PROJECT_NUMBER}`;

export const getSecret = async (name: string, ver: string = 'latest') => {
  const projectId = await client.getProjectId();
  const secretPath = `${client.secretPath(projectId, name)}/versions/${ver}`;

  const [version] = await client.accessSecretVersion({
    name: secretPath,
  });

  if (version) {
    try {
      return version.payload?.data?.toString();
    } catch (err) {
      throw Error(
        `Unable to parse secret from Secret Manager. Make sure the secret is JSON formatted: ${err}`,
      );
    }
  }
  throw Error(`Environment variable not found (${name})`);
};

export const listSecrets = async () => {
  const projectId = await client.getProjectId();
  const parent = client.projectPath(projectId);
  const [secrets] = await client.listSecrets({
    parent, // : `projects/${projectId}`,
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
