import { Clock } from 'lucide-react';
import { cn } from '../utils/cn';

interface RateLimitInfoProps {
  remainingTime: number | null;
  className?: string;
}

export function RateLimitInfo({ remainingTime, className }: RateLimitInfoProps) {
  if (!remainingTime) return null;

  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;
  const timeString = minutes > 0 
    ? `${minutes}m ${seconds}s`
    : `${seconds}s`;

  return (
    <div 
      className={cn(
        "flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-md",
        className
      )}
    >
      <Clock className="w-4 h-4" />
      <span>
        Please wait {timeString} before trying again
      </span>
    </div>
  );
} 