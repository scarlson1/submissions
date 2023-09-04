import { ValidationError } from 'express-validator';

import { CustomError, ICustomError } from './customError';

export class RequestValidationError extends CustomError {
  statusCode = 400;

  constructor(public errors: ValidationError[]) {
    super('Invalid request parameters');

    Object.setPrototypeOf(this, RequestValidationError.prototype);
  }

  serializeErrors() {
    return this.errors.map((err) => {
      let field;
      if (err.type === 'field') field = err.path;
      if (err.type === 'unknown_fields') field = err.fields.map((field) => field.path).join(', ');

      let result: ICustomError = { message: err.msg }; //field: err.param
      if (field) result['field'] = field;

      return result;
    });
  }
}

// docs: https://express-validator.github.io/docs/migration-v6-to-v7

// const result = validationResult(req).formatWith(error => {
//   switch (error.type) {
//     case 'field':
//       // this is a FieldValidationError
//       return `Error on field ${error.path}`;

//     case 'alternative':
//     case 'grouped_alternative':
//       // this is an AlternativeValidationError or GroupedAlternativeValidationError
//       console.log(error.nestedErrors);
//       return error.msg;

//     case 'unknown_fields':
//       // this is an UnknownFieldValidationError
//       const fields = error.fields.map(field => field.path).join(', ');
//       return `Unknown fields found, please remove them: ${fields}`;

//     default:
//       // Not a known type.
//       throw new Error(`Not a known express-validator error: ${error.type}`);
//   }
// });
