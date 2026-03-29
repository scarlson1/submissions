export interface ICustomError {
  message: string;
  field?: string;
  type?: string;
  code?: string;
  decline_code?: string;
  param?: string;
}

export abstract class CustomError extends Error {
  abstract statusCode: number;

  constructor(message: string) {
    super(message);

    Object.setPrototypeOf(this, CustomError.prototype);
  }

  abstract serializeErrors(): ICustomError[];

  // abstract serializeErrors(): {
  //   message: string;
  //   field?: string;
  //   type?: string;
  //   code?: string;
  //   decline_code?: string;
  // }[];
}
