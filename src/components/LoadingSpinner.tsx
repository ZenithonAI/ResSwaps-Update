import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ size = 24, className, fullScreen }: LoadingSpinnerProps) {
  const spinner = (
    <Loader2 
      size={size}
      className={cn(
        "animate-spin text-gray-500",
        className
      )}
    />
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
} 