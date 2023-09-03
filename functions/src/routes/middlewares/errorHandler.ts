import { NextFunction, Request, Response } from 'express';
// import { FirebaseError } from '@firebase/util';

import { CustomError } from '../errors';
// import { IDemandError } from '../errors';
// import { IDemandAuthError } from '../errors';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CustomError) {
    console.log('returning custom errors: ', err.serializeErrors());
    return res.status(err.statusCode).send({ errors: err.serializeErrors() });
  }

  // if (err instanceof IDemandAuthError || err instanceof IDemandError) {
  //   return res.status(err.statusCode).send({ errors: [{ code: err.code, message: err.message }] });
  // }

  // if (err instanceof FirebaseError) {
  //   return res.status(400).send({ errors: [{ code: err.code, message: err.message }] });
  // }

  console.error(err.message);
  return res.status(400).send({
    errors: [{ message: 'Something went wrong' }],
  });
};

export default errorHandler;
