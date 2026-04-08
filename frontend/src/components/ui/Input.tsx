import type { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  leadingIcon?: ReactNode;
}

export function Input({ className, leadingIcon, ...props }: InputProps) {
  if (leadingIcon) {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
          {leadingIcon}
        </div>
        <input
          className={cn(
            "h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 pl-11 pr-4 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:bg-white dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-600",
            className
          )}
          {...props}
        />
      </div>
    );
  }

  return (
    <input
      className={cn(
        "h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:bg-white dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-600",
        className
      )}
      {...props}
    />
  );
}
