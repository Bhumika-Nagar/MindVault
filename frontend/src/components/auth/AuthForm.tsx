import { LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface AuthFormProps {
  title: string;
  description: string;
  submitLabel: string;
  footerLabel: string;
  footerLinkLabel: string;
  footerHref: string;
  username: string;
  password: string;
  error: string | null;
  isSubmitting: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => void;
}

export function AuthForm({
  title,
  description,
  submitLabel,
  footerLabel,
  footerLinkLabel,
  footerHref,
  username,
  password,
  error,
  isSubmitting,
  onUsernameChange,
  onPasswordChange,
  onSubmit
}: AuthFormProps) {
  return (
    <div className="surface w-full max-w-md p-8">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-400">MindVault</p>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
          {title}
        </h1>
        <p className="text-sm leading-6 text-stone-500 dark:text-stone-400">{description}</p>
      </div>

      <div className="mt-8 space-y-5">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Username</span>
          <input
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:bg-white dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-600"
            placeholder="bhumika"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:bg-white dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-600"
            placeholder="minimum 6 characters"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
          {submitLabel}
        </button>

        <p className="text-center text-sm text-stone-400">
          {footerLabel}{" "}
          <Link to={footerHref} className="font-medium text-stone-700 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white">
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </div>
  );
}
