import { CustomError } from './customError';

export class TokenRevokedError extends CustomError {
  statusCode = 403;

  constructor() {
    super('auth/id-token-revoked');

    Object.setPrototypeOf(this, TokenRevokedError.prototype);
  }

  serializeErrors() {
    return [
      { message: 'Token revoked. Reauthenticate to refresh token.', code: 'auth/id-token-revoked' },
    ];
  }
}
