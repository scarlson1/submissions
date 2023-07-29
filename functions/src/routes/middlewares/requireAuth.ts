import { Response, NextFunction } from 'express';

import { NotAuthorizedError } from '../errors/notAuthorizedError';
import { RequestUserAuth } from '../../common';

export const requireAuth = (req: RequestUserAuth, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new NotAuthorizedError();
  }

  next();
};
