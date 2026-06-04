import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    className={cn('w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none ring-0 transition focus:border-primary', className)}
    {...props}
  />
);

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    className={cn('w-full rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none transition focus:border-primary', className)}
    {...props}
  />
);
