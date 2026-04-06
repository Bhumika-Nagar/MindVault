import { FileText, Headphones, Video } from "lucide-react";
import { cn } from "../../lib/cn";
import type { ContentType } from "../../types/content";

interface ContentTypeOption {
  value: ContentType;
  label: string;
  description: string;
  icon: typeof Headphones;
}

const CONTENT_TYPE_OPTIONS: ContentTypeOption[] = [
  {
    value: "audio",
    label: "Audio",
    description: "Podcasts, spaces, and voice notes",
    icon: Headphones
  },
  {
    value: "video",
    label: "Video",
    description: "Tutorials, talks, and clips",
    icon: Video
  },
  {
    value: "article",
    label: "Article",
    description: "Essays, docs, and saved reads",
    icon: FileText
  }
];

interface ContentTypeSelectorProps {
  value: ContentType;
  onChange: (value: ContentType) => void;
  disabled?: boolean;
}

export function ContentTypeSelector({
  value,
  onChange,
  disabled = false
}: ContentTypeSelectorProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {CONTENT_TYPE_OPTIONS.map((option) => {
        const isSelected = option.value === value;
        const Icon = option.icon;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={cn(
              "group rounded-2xl border px-4 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 disabled:cursor-not-allowed disabled:opacity-60",
              isSelected
                ? "border-stone-900 bg-stone-900 text-white shadow-lg shadow-stone-900/10 dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900"
                : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-white dark:border-stone-800 dark:bg-stone-950 dark:text-stone-200 dark:hover:border-stone-700 dark:hover:bg-stone-900"
            )}
            aria-pressed={isSelected}
          >
            <span className="flex items-center gap-3">
              <span
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-xl border transition",
                  isSelected
                    ? "border-white/20 bg-white/10 dark:border-stone-300 dark:bg-stone-200"
                    : "border-stone-200 bg-white text-stone-500 group-hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300"
                )}
              >
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{option.label}</span>
                <span
                  className={cn(
                    "mt-1 block text-xs leading-5",
                    isSelected ? "text-stone-200 dark:text-stone-700" : "text-stone-400"
                  )}
                >
                  {option.description}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
