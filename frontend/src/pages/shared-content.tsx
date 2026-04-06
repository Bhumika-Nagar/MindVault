import { ExternalLink, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { contentService } from "../services/content";
import type { Content } from "../types/content";

export default function SharedContentPage() {
  const { shareLink } = useParams<{ shareLink: string }>();
  const [contentItems, setContentItems] = useState<Content[]>([]);
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSharedContent() {
      if (!shareLink) {
        setErrorMessage("Invalid share link.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await contentService.getSharedContent(shareLink);
        setUsername(response.username);
        setContentItems(response.content);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Failed to load shared content.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSharedContent();
  }, [shareLink]);

  return (
    <div className="min-h-full bg-canvas px-4 py-6 dark:bg-canvas-dark sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="surface px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-stone-400">MindVault</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900 dark:text-stone-100">
            Shared brain
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
            {username ? `${username}'s saved content collection.` : "A public collection of saved content."}
          </p>
        </header>

        {isLoading ? (
          <div className="surface flex min-h-48 items-center justify-center">
            <LoaderCircle className="size-5 animate-spin text-stone-400" />
          </div>
        ) : errorMessage ? (
          <div className="surface p-6 text-sm leading-6 text-rose-600 dark:text-rose-300">{errorMessage}</div>
        ) : contentItems.length === 0 ? (
          <div className="surface p-6 text-sm leading-6 text-stone-500 dark:text-stone-400">
            No shared content is available for this link yet.
          </div>
        ) : (
          <div className="grid gap-4">
            {contentItems.map((item) => (
              <article key={item._id} className="surface p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-stone-900 dark:text-stone-100">
                      {item.title}
                    </h2>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-400">{item.type}</p>
                  </div>

                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
                  >
                    <ExternalLink className="size-4" />
                    Open
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="text-center text-sm text-stone-500 dark:text-stone-400">
          <Link to="/signin" className="font-medium text-stone-700 hover:text-stone-900 dark:text-stone-200 dark:hover:text-stone-50">
            Open MindVault
          </Link>
        </div>
      </div>
    </div>
  );
}
