/**
 * Injected via jest.config.js `setupFilesAfterEnv`.
 *
 * env.ts (setupFiles) has already run by this point, so GCLOUD_PROJECT and
 * emulator hosts are set before any firebase-admin code initialises.
 *
 * How to use firebase-functions-test in individual test files:
 *
 *   import firebaseFunctionsTest from 'firebase-functions-test';
 *   const testEnv = firebaseFunctionsTest(); // offline mode — no credentials
 *   afterAll(() => testEnv.cleanup());
 *
 * For integration tests that need the Firestore emulator, make sure
 * FIRESTORE_EMULATOR_HOST is set (already done in env.ts) and the emulator
 * is running before the test suite starts.
 */

export {};
