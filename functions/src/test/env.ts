/**
 * Injected via jest.config.js `setupFiles` — runs before the test framework
 * installs and before any test module is imported. Setting env vars here
 * ensures firebase-admin and firebase-functions see the emulator config when
 * they first initialize.
 */

process.env['GCLOUD_PROJECT'] = 'test-project';
process.env['FIREBASE_CONFIG'] = JSON.stringify({ projectId: 'test-project' });

// Point SDKs at local emulators (used for integration tests; safe to set
// for unit tests too since unit tests never actually connect to Firestore).
process.env['FIRESTORE_EMULATOR_HOST'] = 'localhost:8082';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] = 'localhost:9099';

// Tells firebase-functions/params to return empty strings instead of throwing
// when .value() is called outside a real Functions runtime.
process.env['FUNCTIONS_EMULATOR'] = 'true';
