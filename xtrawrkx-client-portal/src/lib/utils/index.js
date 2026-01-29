import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  }).format(new Date(date));
}

export function formatRelativeTime(date) {
  const now = new Date();
  const targetDate = new Date(date);
  const diffInHours = Math.abs(now - targetDate) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.abs(now - targetDate) / (1000 * 60);
    return `${Math.floor(diffInMinutes)}m ago`;
  } else if (diffInHours < 24) {
    return `${Math.floor(diffInHours)}h ago`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  }
}

export function getInitials(name) {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function generateProjectColor(projectName) {
  const colors = ['yellow', 'green', 'blue', 'purple', 'pink', 'orange'];
  const index = projectName.length % colors.length;
  return colors[index];
}

export function formatTaskCount(count) {
  if (count === 0) return 'no task';
  if (count === 1) return '1 task';
  return `${count} tasks`;
}

export function getTrendIcon(value) {
  if (value > 0) return '↗';
  if (value < 0) return '↘';
  return '→';
}

export function getTrendColor(value) {
  if (value > 0) return 'text-success-600';
  if (value < 0) return 'text-error-600';
  return 'text-neutral-600';
}