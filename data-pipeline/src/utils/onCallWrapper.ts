import * as Sentry from '@sentry/node';
import { CallableRequest } from 'firebase-functions/v2/https';

export type Primitive =
  | string
  | number
  | bigint
  | boolean
  | symbol
  | null
  | undefined;

// https://medium.com/qualdesk/how-to-capture-typescript-firebase-functions-errors-in-sentry-d6984951ed9

Sentry.init({
  dsn: 'https://4ae7fbd137ef4a5daec92aa57c0c660a@o4505115580694528.ingest.sentry.io/4505115584757760',
  maxBreadcrumbs: 50,
  // environment: projectID.value(), // read from SENTRY_ENV
  // enabled: !emulators.value(),
  // debug: projectID.value() === 'idemand-submissions-dev',
});

export const onCallWrapper = <T = any>(
  // pass an identifying ‘name’ as a string
  // This will show up in Sentry error titles
  // so it needs to a) be unique and b) make sense
  name: string,

  // This is the handler itself, which previously
  // you would have exported directly from the
  // function file
  handler: (request: CallableRequest<T>) => any | Promise<any>,
) => {
  return async (request: CallableRequest<T>) => {
    // 1. Start the Sentry transaction
    const transaction = Sentry.startTransaction({
      name,
      op: 'functions.https.onCall',
    });

    // 2. Set the transaction context
    // In this example, we’re sending the uid from Firebase auth
    // You can send any relevant data here that might help with
    // debugging
    Sentry.setContext('Function context', {
      ...(request.data || {}),
      uid: request.auth?.uid,
      function: name,
      op: 'onCall',
    });

    try {
      // 3. Try calling the function handler itself
      // return await handler(data, context);
      return await handler(request);
    } catch (e) {
      // 4. Send any errors to Sentry
      await Sentry.captureException(e);
      await Sentry.flush(1000);

      // Don’t forget to throw them too!

      throw e;
    } finally {
      // 5. Finish the Sentry transaction
      Sentry.configureScope((scope) => scope.clear());
      transaction.finish();
    }
  };
};

export const reportErrorSentry = (
  e: any,
  tags: Record<string, Primitive> = {},
) => Sentry.captureException(e, { tags });

// export interface ScopeContext {
//   user: User;
//   level: Severity | SeverityLevel;
//   extra: Extras;
//   contexts: Contexts;
//   tags: {
//     [key: string]: Primitive;
//   };
//   fingerprint: string[];
//   requestSession: RequestSession;
// }
