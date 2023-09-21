import { NextFunction, Response } from 'express';

import { RequestUserAuth } from '../../common/index.js';
import { NotAuthorizedError } from '../errors/index.js';

export const requireAuth = (req: RequestUserAuth, res: Response, next: NextFunction) => {
  if (!req.user) throw new NotAuthorizedError();

  next();
};
