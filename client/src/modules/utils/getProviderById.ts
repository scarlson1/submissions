import {
  GoogleAuthProvider,
  OAuthProvider,
  ProviderId,
  EmailAuthProvider,
  PhoneAuthProvider,
} from 'firebase/auth';
import { auth } from 'firebaseConfig';

// example: https://stackoverflow.com/a/55581920

export const getProviderForProviderId = (providerId: any) => {
  console.log(`Getting provider for providerId: ${providerId}`);

  switch (providerId) {
    case 'microsoft':
      return new OAuthProvider('microsoft.com');
    case 'microsoft.com':
      return new OAuthProvider('microsoft.com');
    case ProviderId.GOOGLE:
      return new GoogleAuthProvider();
    case ProviderId.PASSWORD:
      return new EmailAuthProvider();
    case ProviderId.PHONE:
      return new PhoneAuthProvider(auth);
    // case ProviderId.GITHUB:
    //   return new GithubAuthProvider();
    // case 'apple.com':
    //   console.log('ERROR: APPLE NOT SUPPORTED');
    //   return new Error('Apple Auth not supported');
    default:
      return null;
  }
};
