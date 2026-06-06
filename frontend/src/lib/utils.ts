/**
 * Shared UI utility helpers for the frontend.
 * Export: cn — merges Tailwind CSS class strings using clsx + tailwind-merge,
 * resolving class conflicts (e.g. duplicate padding/margin utilities) correctly.
 */
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
