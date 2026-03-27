import type { NextFunction, Response } from 'express';
import type { ClaimArray, RequestUserAuth } from '../../common/index.js';
import { NotAuthorizedError } from '../errors/notAuthorizedError.js';

export const requireClaim =
  (claims: ClaimArray) =>
  (req: RequestUserAuth, res: Response, next: NextFunction) => {
    const hasClaim = claims.some((c) => req.user && req.user[c]);

    if (!hasClaim) throw new NotAuthorizedError();

    next();
  };
