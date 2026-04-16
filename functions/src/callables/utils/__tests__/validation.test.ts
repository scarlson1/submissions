import { HttpsError } from 'firebase-functions/v1/https';
import { validate } from '../validation.js';

describe('validate', () => {
  it('does not throw when condition is truthy', () => {
    expect(() => validate(true, 'failed-precondition', 'msg')).not.toThrow();
    expect(() => validate(1, 'failed-precondition', 'msg')).not.toThrow();
    expect(() => validate('ok', 'failed-precondition', 'msg')).not.toThrow();
  });

  it('throws HttpsError when condition is falsy', () => {
    expect(() => validate(false, 'failed-precondition', 'bad input')).toThrow(HttpsError);
  });

  it('throws HttpsError when condition is null or undefined', () => {
    expect(() => validate(null, 'not-found', 'missing')).toThrow(HttpsError);
    expect(() => validate(undefined, 'not-found', 'missing')).toThrow(HttpsError);
  });

  it('uses the provided error code', () => {
    let caught: any;
    try {
      validate(false, 'unauthenticated', 'sign in required');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(HttpsError);
    expect(caught.code).toBe('unauthenticated');
  });

  it('uses the provided message', () => {
    let caught: any;
    try {
      validate(false, 'failed-precondition', 'docId required');
    } catch (err) {
      caught = err;
    }
    expect(caught.message).toBe('docId required');
  });

  it('falls back to a generic message when none is provided', () => {
    let caught: any;
    try {
      validate(false, 'internal');
    } catch (err) {
      caught = err;
    }
    expect(caught.message).toBeTruthy();
  });
});
