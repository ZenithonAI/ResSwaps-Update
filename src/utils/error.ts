import { PostgrestError } from '@supabase/supabase-js';

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public status?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }

  static isRateLimit(error: AppError): boolean {
    return error.code === 'RATELIMIT' || error.status === 429;
  }
}

export function handleSupabaseError(error: PostgrestError | null): never {
  if (!error) throw new AppError('An unknown error occurred');

  // Handle rate limit errors
  if (error.code === 'RATELIMIT') {
    throw new AppError(
      'Too many attempts. Please wait before trying again.',
      error.code,
      429,
      error.details
    );
  }

  // Handle other database errors
  throw new AppError(
    error.message,
    error.code,
    error.code === 'PGRST116' ? 404 : 500,
    error.details
  );
}

export function handleAuthError(error: Error & { status?: number }): never {
  throw new AppError(
    error.message,
    undefined,
    error.status || 500
  );
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function getRateLimitRemainingTime(error: AppError): number | null {
  if (!AppError.isRateLimit(error) || !error.details) return null;
  
  try {
    const details = typeof error.details === 'string' 
      ? JSON.parse(error.details)
      : error.details;
    
    return details.retryAfter || null;
  } catch {
    return null;
  }
} 