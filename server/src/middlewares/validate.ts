import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        error: 'Dados inválidos',
        details: result.error.flatten(),
      });
      return;
    }

    if (!req.validated) {
      req.validated = {};
    }
    req.validated[source] = result.data;

    if (source === 'body') {
      req.body = result.data;
    }

    next();
  };
}
