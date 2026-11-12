import type { ButtonHTMLAttributes, InputHTMLAttributes, Ref } from 'react';

export const inputCls =
  'w-full min-h-11 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500';

export function Input({ ref, ...props }: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} className={`${inputCls} ${props.className ?? ''}`} />;
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const variants: Record<Variant, string> = {
  primary: 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50',
  secondary: 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'hover:bg-zinc-100 dark:hover:bg-zinc-800',
};

export function Button({ variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button {...props} className={`min-h-11 px-4 rounded-lg font-medium transition-colors ${variants[variant]} ${className}`} />;
}

/** Parse an optional number field: '' → undefined. */
export const optNum = (s: string): number | undefined => {
  if (s.trim() === '') return undefined;
  const n = Number(s.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

export const fmt = (n: number) => n.toLocaleString();
