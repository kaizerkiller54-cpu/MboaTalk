import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from './error';

export const validateBody = (schema: z.ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.flatten();
      return next(new AppError('Données invalides.', 400, details.fieldErrors));
    }
    req.body = result.data;
    next();
  };
};

export const validateParams = (schema: z.ZodTypeAny) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return next(new AppError('Paramètres invalides.', 400));
    }
    req.params = result.data as any;
    next();
  };
};
