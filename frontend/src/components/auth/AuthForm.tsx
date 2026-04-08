import { LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Input } from "../ui/Input";

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
    <Card className="w-full max-w-md p-8">
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
          <Input
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            placeholder="bhumika"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Password</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            placeholder="minimum 6 characters"
          />
        </label>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
            {error}
          </div>
        ) : null}

        <Button
          type="button"
          onClick={onSubmit}
          fullWidth
          className="h-12"
          leadingIcon={isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
        >
          {submitLabel}
        </Button>

        <p className="text-center text-sm text-stone-400">
          {footerLabel}{" "}
          <Link to={footerHref} className="font-medium text-stone-700 hover:text-stone-900 dark:text-stone-200 dark:hover:text-white">
            {footerLinkLabel}
          </Link>
        </p>
      </div>
    </Card>
  );
}
