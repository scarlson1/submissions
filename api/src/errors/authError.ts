import { CustomError } from './customError.js';

export class AuthError extends CustomError {
  statusCode = 400;
  code;

  constructor(code: string, message: string, errCode: number = 400) {
    super(message);

    this.code = code;
    this.statusCode = errCode;

    Object.setPrototypeOf(this, AuthError.prototype);
  }

  serializeErrors() {
    return [{ message: this.message, code: this.code || '' }];
  }
}
