import { NextFunction, Response } from 'express';

import { RequestUserAuth } from '../../common';
import { NotAuthorizedError } from '../errors/notAuthorizedError';

export const requireAuth = (req: RequestUserAuth, res: Response, next: NextFunction) => {
  if (!req.user) throw new NotAuthorizedError();

  next();
};
