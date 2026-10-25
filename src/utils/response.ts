import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function sendError(
  res: Response,
  message: string = 'Internal Server Error',
  statusCode: number = 500,
  error?: unknown
) {
  const errorDetails = error instanceof Error ? error.message : undefined;
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errorDetails ? { error: errorDetails } : {}),
  });
}
