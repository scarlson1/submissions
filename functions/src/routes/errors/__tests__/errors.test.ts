import { CustomError } from '../customError.js';
import { NotAuthorizedError } from '../notAuthorizedError.js';
import { NotFoundError } from '../notFoundError.js';
import { RequestValidationError } from '../requestValidationError.js';
import { TokenRevokedError } from '../tokenRevokedError.js';

describe('NotAuthorizedError', () => {
  it('has statusCode 401', () => {
    expect(new NotAuthorizedError().statusCode).toBe(401);
  });

  it('is an instance of CustomError and Error', () => {
    const err = new NotAuthorizedError();
    expect(err).toBeInstanceOf(CustomError);
    expect(err).toBeInstanceOf(Error);
  });

  it('serializeErrors returns a single not-authorized message', () => {
    const errors = new NotAuthorizedError().serializeErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/not authorized/i);
  });
});

describe('NotFoundError', () => {
  it('has statusCode 404', () => {
    expect(new NotFoundError('Missing resource').statusCode).toBe(404);
  });

  it('serializeErrors returns not-found message', () => {
    const errors = new NotFoundError('x').serializeErrors();
    expect(errors[0].message).toMatch(/not found/i);
  });
});

describe('TokenRevokedError', () => {
  it('has statusCode 403', () => {
    expect(new TokenRevokedError().statusCode).toBe(403);
  });

  it('serializeErrors includes revoked code', () => {
    const errors = new TokenRevokedError().serializeErrors();
    expect(errors[0].code).toBe('auth/id-token-revoked');
  });
});

describe('RequestValidationError', () => {
  const makeFieldError = (path: string, msg: string) =>
    ({ type: 'field', path, msg, location: 'body', value: '' }) as any;

  it('has statusCode 400', () => {
    expect(new RequestValidationError([makeFieldError('email', 'required')]).statusCode).toBe(400);
  });

  it('serializeErrors maps field errors to message + field', () => {
    const err = new RequestValidationError([makeFieldError('email', 'Must be valid email')]);
    const [first] = err.serializeErrors();
    expect(first.message).toBe('Must be valid email');
    expect(first.field).toBe('email');
  });

  it('handles multiple validation errors', () => {
    const errors = [makeFieldError('email', 'required'), makeFieldError('name', 'required')];
    expect(new RequestValidationError(errors).serializeErrors()).toHaveLength(2);
  });

  it('omits field when error type is not field', () => {
    const altError = { type: 'alternative', msg: 'One of these must be set', nestedErrors: [] } as any;
    const [result] = new RequestValidationError([altError]).serializeErrors();
    expect(result.message).toBe('One of these must be set');
    expect(result.field).toBeUndefined();
  });
});
