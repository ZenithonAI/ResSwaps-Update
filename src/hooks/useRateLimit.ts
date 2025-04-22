import { useState, useCallback } from 'react';
import { AppError, getRateLimitRemainingTime } from '../utils/error';

interface RateLimitState {
  isBlocked: boolean;
  remainingTime: number | null;
}

interface UseRateLimitOptions {
  onRateLimit?: (remainingTime: number) => void;
}

export function useRateLimit(options: UseRateLimitOptions = {}) {
  const [state, setState] = useState<RateLimitState>({
    isBlocked: false,
    remainingTime: null
  });

  const handleRateLimit = useCallback((error: unknown) => {
    if (error instanceof AppError && AppError.isRateLimit(error)) {
      const remainingTime = getRateLimitRemainingTime(error);
      
      setState({
        isBlocked: true,
        remainingTime
      });

      if (remainingTime && options.onRateLimit) {
        options.onRateLimit(remainingTime);
      }

      // Start countdown timer
      if (remainingTime) {
        const timer = setInterval(() => {
          setState(prev => {
            const newTime = prev.remainingTime ? prev.remainingTime - 1 : null;
            
            if (!newTime || newTime <= 0) {
              clearInterval(timer);
              return { isBlocked: false, remainingTime: null };
            }
            
            return { ...prev, remainingTime: newTime };
          });
        }, 1000);

        // Cleanup timer
        return () => clearInterval(timer);
      }
    }
  }, [options]);

  const wrapRateLimitedAction = useCallback(<T extends (...args: any[]) => Promise<any>>(
    action: T
  ): T => {
    return (async (...args: Parameters<T>) => {
      if (state.isBlocked) {
        throw new AppError(
          'Please wait before trying again',
          'RATELIMIT',
          429,
          { retryAfter: state.remainingTime }
        );
      }

      try {
        return await action(...args);
      } catch (error) {
        handleRateLimit(error);
        throw error;
      }
    }) as T;
  }, [state.isBlocked, state.remainingTime, handleRateLimit]);

  return {
    isRateLimited: state.isBlocked,
    remainingTime: state.remainingTime,
    wrapRateLimitedAction
  };
} 