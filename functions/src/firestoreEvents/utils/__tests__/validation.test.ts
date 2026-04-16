import { validate } from '../validation.js';

describe('firestoreEvent validate', () => {
  it('does not throw when condition is truthy', () => {
    expect(() => validate(true, 'msg')).not.toThrow();
    expect(() => validate(1, 'msg')).not.toThrow();
    expect(() => validate('value', 'msg')).not.toThrow();
  });

  it('throws a plain Error (not HttpsError) when condition is falsy', () => {
    let caught: any;
    try {
      validate(false, 'field required');
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    // Should NOT be an HttpsError — firestoreEvent validate uses plain Error
    expect(caught.code).toBeUndefined();
    expect(caught.message).toBe('field required');
  });

  it('throws when condition is null or undefined', () => {
    expect(() => validate(null, 'missing')).toThrow('missing');
    expect(() => validate(undefined, 'missing')).toThrow('missing');
  });

  it('uses a fallback message when none is provided', () => {
    let caught: any;
    try {
      validate(false);
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(Error);
    expect(caught.message).toBeTruthy();
  });
});
