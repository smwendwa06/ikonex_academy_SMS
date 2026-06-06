import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[Error]', err.message);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    res.status(409).json({ message: 'A record with this value already exists.' });
    return;
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    res.status(404).json({ message: 'Record not found.' });
    return;
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    message: err.message || 'Internal server error',
  });
}
