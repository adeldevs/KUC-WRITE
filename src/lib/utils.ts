import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDeadline(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return 'Overdue';
  if (days === 0) return 'Due Today';
  if (days === 1) return 'Due Tomorrow';
  if (days <= 7) return `${days}d left`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Psychology',
  'English Literature',
  'History',
  'Law',
  'Medicine',
  'Architecture',
  'Fine Arts',
  'Other',
] as const;

export const IMGBB_API_KEY = import.meta.env.VITE_IMGBB_API_KEY || 'demo_key';

export async function uploadToImgBB(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) throw new Error('Image upload failed');
  const data = await response.json();
  return data.data.url as string;
}
