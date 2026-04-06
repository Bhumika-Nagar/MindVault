import { Link2, LoaderCircle, Sparkles } from "lucide-react";
import { useId } from "react";
import type { ContentType } from "../../types/content";
import { ContentTypeSelector } from "./ContentTypeSelector";

export interface CreateContentFormValues {
  title: string;
  link: string;
  type: ContentType;
}

interface CreateContentFormProps {
  values: CreateContentFormValues;
  isSubmitting: boolean;
  submitMessage: string | null;
  submitError: string | null;
  onChange: (field: keyof CreateContentFormValues, value: string | ContentType) => void;
  onSubmit: () => void;
}

export function CreateContentForm({
  values,
  isSubmitting,
  submitMessage,
  submitError,
  onChange,
  onSubmit
}: CreateContentFormProps) {
  const titleId = useId();
  const linkId = useId();

  return (
    <section className="surface mx-auto w-full max-w-3xl overflow-hidden">
      <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-5 dark:border-stone-800 dark:bg-stone-950/60 sm:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-400">
              Create content
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
              Save something worth revisiting
            </h2>
            <p className="max-w-xl text-sm leading-6 text-stone-500 dark:text-stone-400">
              The backend requires a title, a valid link, and a content type. Pick the
              format first, then add the resource you want to keep in MindVault.
            </p>
          </div>

          <span className="hidden rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 sm:inline-flex">
            Extensible selector
          </span>
        </div>
      </div>

      <div className="space-y-8 px-6 py-6 sm:px-8 sm:py-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-stone-400" />
            <label className="text-sm font-medium text-stone-700 dark:text-stone-200">
              Content type
            </label>
          </div>
          <ContentTypeSelector
            value={values.type}
            onChange={(nextType) => onChange("type", nextType)}
            disabled={isSubmitting}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-200">Title</span>
            <input
              id={titleId}
              value={values.title}
              onChange={(event) => onChange("title", event.target.value)}
              placeholder="Design systems talk"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:bg-white dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-600"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-stone-700 dark:text-stone-200">
              Resource link
            </span>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
              <input
                id={linkId}
                value={values.link}
                onChange={(event) => onChange("link", event.target.value)}
                placeholder="https://example.com/resource"
                disabled={isSubmitting}
                className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 pl-11 pr-4 text-sm text-stone-700 outline-none transition focus:border-stone-400 focus:bg-white dark:border-stone-800 dark:bg-stone-950 dark:text-stone-100 dark:focus:border-stone-600"
              />
            </div>
          </label>
        </div>

        {(submitMessage || submitError) && (
          <div
            className={
              submitError
                ? "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
                : "rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            }
          >
            {submitError ?? submitMessage}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-stone-200 pt-6 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-6 text-stone-400">
            Current options cover audio, video, and article, and the selector is ready to
            grow with the backend enum later.
          </p>

          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
          >
            {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {isSubmitting ? "Saving content..." : "Create content"}
          </button>
        </div>
      </div>
    </section>
  );
}
