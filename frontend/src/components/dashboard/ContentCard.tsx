import { ExternalLink, FileAudio, FileText, Film, Share2, Trash2 } from "lucide-react";
import type { Content, ContentStatus, ContentType } from "../../types/content";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

const iconByType: Record<ContentType, typeof FileText> = {
  article: FileText,
  audio: FileAudio,
  image: FileText,
  tweet: FileText,
  video: Film
};

interface ContentCardProps {
  item: Content;
  onDelete?: (contentId: string) => void;
  isDeleting?: boolean;
  showShareHint?: boolean;
  showSourceButton?: boolean;
}

const statusCopy: Partial<Record<ContentStatus, string>> = {
  pending: "Processing content...",
  failed: "Processing failed"
};

function getDisplaySummary(item: Content): string | null {
  if (item.status === "pending" || item.status === "failed") {
    return statusCopy[item.status] ?? null;
  }

  const summary = item.summary?.trim();
  return summary ? summary : null;
}

export function ContentCard({
  item,
  onDelete,
  isDeleting = false,
  showShareHint = true,
  showSourceButton = true
}: ContentCardProps) {
  const Icon = iconByType[item.type];
  const summary = getDisplaySummary(item);
  const hasDeleteAction = typeof onDelete === "function";

  return (
    <Card as="article" className="p-5">
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
              <span className="mt-2 inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-stone-500 dark:bg-stone-800 dark:text-stone-300">
                {item.type}
              </span>
            </div>
          </div>
        </div>

        {hasDeleteAction ? (
          <Button
            type="button"
            onClick={() => onDelete(item._id)}
            disabled={isDeleting}
            variant="danger"
            size="icon"
            aria-label={`Delete ${item.title}`}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>

      {summary ? (
        <p
          className={cn(
            "mt-4 line-clamp-3 text-sm leading-6 text-stone-500 dark:text-stone-400",
            item.status === "failed" && "text-rose-600 dark:text-rose-300"
          )}
        >
          {summary}
        </p>
      ) : null}

      {(showSourceButton || showShareHint) ? (
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-stone-500 dark:text-stone-400">
          {showSourceButton ? (
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 transition hover:text-stone-800 dark:hover:text-stone-100"
            >
              <ExternalLink className="size-4" />
              Open source
            </a>
          ) : null}
          {showShareHint ? (
            <span className="inline-flex items-center gap-2">
              <Share2 className="size-4" />
              Ready to include in shared brain
            </span>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
