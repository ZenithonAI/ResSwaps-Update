/**
 * Format the distance between a given date and now in a human-readable format
 */
export function formatDistance(date: Date): string {
  const now = new Date();
  const diffInMs = date.getTime() - now.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    return 'Past';
  }
  
  if (diffInDays === 0) {
    return 'Today';
  }
  
  if (diffInDays === 1) {
    return 'Tomorrow';
  }
  
  if (diffInDays < 7) {
    return `${diffInDays} days`;
  }
  
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  
  const months = Math.floor(diffInDays / 30);
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}

/**
 * Format distance from a given date to now in a human-readable format
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays < 0) {
    return 'In the future';
  }
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'}`;
    }
    
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'}`;
  }
  
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  
  if (diffInDays < 7) {
    return `${diffInDays} days`;
  }
  
  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
  }
  
  const months = Math.floor(diffInDays / 30);
  return `${months} ${months === 1 ? 'month' : 'months'}`;
}