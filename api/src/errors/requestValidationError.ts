import { ValidationError } from 'express-validator';

import { CustomError, type ICustomError } from './customError.js';

export class RequestValidationError extends CustomError {
  statusCode = 400;

  constructor(public errors: ValidationError[]) {
    super('Invalid request parameters');

    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    return this.errors.map((err) => {
      // return { message: err.msg, field: err.param };
      let field;
      if (err.type === 'field') field = err.path;
      if (err.type === 'unknown_fields')
        field = err.fields.map((field) => field.path).join(', ');

      let result: ICustomError = { message: err.msg }; //field: err.param
      if (field) result['field'] = field;

      return result;
    });
  }
}
