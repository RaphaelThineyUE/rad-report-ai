import { validationResult } from 'express-validator';
import type { NextFunction, Request, Response } from 'express';

export const handleValidation = (request: Request, response: Response, next: NextFunction) => {
  const errors = validationResult(request);
  if (errors.isEmpty()) {
    next();
    return;
  }

  response.status(422).json({ errors: errors.array() });
};
