import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class names with Tailwind CSS classes
 * Properly handles conflicts between classes
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}