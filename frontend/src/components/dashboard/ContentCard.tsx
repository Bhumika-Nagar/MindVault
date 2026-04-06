import { ExternalLink, FileAudio, FileText, Film, Share2, Trash2 } from "lucide-react";
import type { Content, ContentType } from "../../types/content";
import { cn } from "../../lib/cn";

const iconByType: Record<ContentType, typeof FileText> = {
  article: FileText,
  audio: FileAudio,
  image: FileText,
  tweet: FileText,
  video: Film
};

interface ContentCardProps {
  item: Content;
  onDelete: (contentId: string) => void;
  isDeleting: boolean;
}

export function ContentCard({ item, onDelete, isDeleting }: ContentCardProps) {
  const Icon = iconByType[item.type];

  return (
    <article className="surface p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-11 items-center justify-center rounded-2xl",
                item.type === "audio" && "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
                item.type === "video" && "bg-sky-100 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
                item.type === "article" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
                !["audio", "video", "article"].includes(item.type) &&
                  "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-200"
              )}
            >
              <Icon className="size-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-stone-900 dark:text-stone-100">
                {item.title}
              </h3>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">{item.type}</p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(item._id)}
          disabled={isDeleting}
          className="inline-flex size-10 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-rose-900 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
          aria-label={`Delete ${item.title}`}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
        <a
          href={item.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 transition hover:text-stone-800 dark:hover:text-stone-100"
        >
          <ExternalLink className="size-4" />
          Open source
        </a>
        <span className="inline-flex items-center gap-2">
          <Share2 className="size-4" />
          Ready to include in shared brain
        </span>
      </div>
    </article>
  );
}
